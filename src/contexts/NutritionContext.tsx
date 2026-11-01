"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { FoodItem, DailyLog, DailyTotals } from "@/lib/types";
import { totalsFromLogs } from "@/lib/nutrition";
import { getTodayKey } from "@/lib/dates";
import { useAuth } from "./AuthContext";

interface NutritionContextType {
  dailyLogs: DailyLog[];
  dailyTotals: DailyTotals | null;
  loading: boolean;
  addFoodLog: (food: FoodItem, quantity: number) => Promise<void>;
  deleteFoodLog: (logId: string) => Promise<void>;
  getTodayLogs: () => Promise<void>;
  getLogsByDate: (date: string) => Promise<void>;
}

type PendingInsert = { kind: "insert"; log: DailyLog };
type PendingDelete = { kind: "delete"; logId: string };
type PendingOp = PendingInsert | PendingDelete;

type NutritionCache = {
  version: 1;
  userId: string;
  logsByDate: Record<string, DailyLog[]>;
  pending: PendingOp[];
};

const NutritionContext = createContext<NutritionContextType | undefined>(
  undefined
);

const SINGLE_USER_ID = "00000000-0000-0000-0000-000000000000";
const CACHE_PREFIX = "gymer:nutrition:";
const CACHE_VERSION = 1 as const;

function sortLogs(logs: DailyLog[]) {
  return [...logs].sort((a, b) => {
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();
    return bTime - aTime;
  });
}

function isTransientNetworkError(error: unknown) {
  if (!error) return false;

  const parts: string[] = [];
  if (typeof error === "string") parts.push(error);
  if (error instanceof Error) {
    parts.push(error.name, error.message);
  }
  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    for (const key of ["message", "details", "hint", "code", "name"]) {
      if (typeof record[key] === "string") parts.push(record[key] as string);
    }
    if (record.cause) parts.push(String(record.cause));
  }

  const text = parts.join(" ").toLowerCase();
  return (
    text.includes("failed to fetch") ||
    text.includes("networkerror") ||
    text.includes("network request failed") ||
    text.includes("load failed") ||
    text.includes("fetch failed") ||
    text.includes("abort") ||
    text.includes("aborted") ||
    text.includes("timeout") ||
    text.includes("timed out") ||
    text.includes("err_timed_out") ||
    text.includes("err_connection") ||
    text.includes("err_name_not_resolved") ||
    text.includes("err_internet_disconnected")
  );
}

function cacheKey(userId: string) {
  return `${CACHE_PREFIX}${userId}`;
}

function readCache(userId: string): NutritionCache {
  const fallback: NutritionCache = {
    version: CACHE_VERSION,
    userId,
    logsByDate: {},
    pending: [],
  };

  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(cacheKey(userId));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as NutritionCache;
    if (parsed?.version !== CACHE_VERSION || parsed.userId !== userId) {
      return fallback;
    }
    return {
      version: CACHE_VERSION,
      userId,
      logsByDate: parsed.logsByDate || {},
      pending: Array.isArray(parsed.pending) ? parsed.pending : [],
    };
  } catch {
    return fallback;
  }
}

function writeCache(cache: NutritionCache) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(cacheKey(cache.userId), JSON.stringify(cache));
  } catch {
    // Quota or private-mode failures should never break the UI.
  }
}

function mergeLogs(
  remote: DailyLog[],
  local: DailyLog[],
  pending: PendingOp[]
): DailyLog[] {
  const deletedIds = new Set(
    pending.filter((op): op is PendingDelete => op.kind === "delete").map((op) => op.logId)
  );
  const pendingInserts = pending
    .filter((op): op is PendingInsert => op.kind === "insert")
    .map((op) => op.log);

  const byId = new Map<string, DailyLog>();

  for (const log of remote) {
    if (!deletedIds.has(log.id)) byId.set(log.id, log);
  }

  for (const log of pendingInserts) {
    if (!deletedIds.has(log.id)) byId.set(log.id, log);
  }

  for (const log of local) {
    if (!deletedIds.has(log.id) && !byId.has(log.id)) {
      byId.set(log.id, log);
    }
  }

  return sortLogs([...byId.values()]);
}

function mapFoodsToLogs(
  rows: Array<Record<string, unknown>>,
  foods: FoodItem[] | null
): DailyLog[] {
  const foodMap = new Map((foods || []).map((food) => [food.id, food]));
  return rows.map((row) => {
    const foodId = Number(row.food_id);
    return {
      id: String(row.id),
      user_id: String(row.user_id),
      date: String(row.date),
      food_id: foodId,
      quantity: Number(row.quantity) || 0,
      created_at: String(row.created_at),
      food: foodMap.get(foodId) || null,
    } as DailyLog;
  });
}

export function NutritionProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id || SINGLE_USER_ID;

  const [currentDate, setCurrentDate] = useState(getTodayKey);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(false);

  const logsByDateRef = useRef<Record<string, DailyLog[]>>({});
  const pendingRef = useRef<PendingOp[]>([]);
  const userIdRef = useRef(userId);
  const currentDateRef = useRef(currentDate);
  const flushingRef = useRef(false);
  const mountedRef = useRef(true);

  // Keep refs in sync with the latest values without writing during render.
  useEffect(() => {
    userIdRef.current = userId;
    currentDateRef.current = currentDate;
  }, [userId, currentDate]);

  const persist = useCallback(() => {
    writeCache({
      version: CACHE_VERSION,
      userId: userIdRef.current,
      logsByDate: logsByDateRef.current,
      pending: pendingRef.current,
    });
  }, []);

  const applyLogs = useCallback(
    (date: string, logs: DailyLog[], persistToDisk = true) => {
      const sorted = sortLogs(logs);
      logsByDateRef.current = {
        ...logsByDateRef.current,
        [date]: sorted,
      };
      if (date === currentDateRef.current) {
        setDailyLogs(sorted);
      }
      if (persistToDisk) persist();
    },
    [persist]
  );

  const hydrateFromCache = useCallback(
    (date: string) => {
      const cache = readCache(userIdRef.current);
      logsByDateRef.current = cache.logsByDate;
      pendingRef.current = cache.pending;
      applyLogs(date, cache.logsByDate[date] || [], false);
    },
    [applyLogs]
  );

  const fetchRemoteLogs = useCallback(async (date: string): Promise<DailyLog[] | null> => {
    if (!isSupabaseConfigured || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("date", date)
        .eq("user_id", userIdRef.current)
        .order("created_at", { ascending: false });

      if (error) {
        if (!isTransientNetworkError(error)) {
          console.warn("Nutrition sync skipped:", error.message);
        }
        return null;
      }

      const rows = data || [];
      if (rows.length === 0) return [];

      const foodIds = [
        ...new Set(
          rows
            .map((log) => Number(log.food_id))
            .filter((id) => !Number.isNaN(id))
        ),
      ];

      if (foodIds.length === 0) {
        return mapFoodsToLogs(rows, []);
      }

      const { data: foods, error: foodsError } = await supabase
        .from("foods")
        .select("*")
        .in("id", foodIds);

      if (foodsError) {
        if (!isTransientNetworkError(foodsError)) {
          console.warn("Nutrition food lookup skipped:", foodsError.message);
        }
        return mapFoodsToLogs(rows, []);
      }

      return mapFoodsToLogs(rows, (foods || []) as FoodItem[]);
    } catch (error) {
      if (!isTransientNetworkError(error)) {
        console.warn("Nutrition fetch skipped:", error);
      }
      return null;
    }
  }, []);

  const flushPending = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    // Never push writes while the session is still resolving, otherwise rows
    // would be stamped with the placeholder id and rejected by RLS.
    if (authLoading) return;
    if (flushingRef.current || pendingRef.current.length === 0) return;

    flushingRef.current = true;

    try {
      const remaining: PendingOp[] = [];

      for (const op of pendingRef.current) {
        try {
          if (op.kind === "insert") {
            const { error } = await supabase.from("daily_logs").insert({
              id: op.log.id,
              // Re-stamp with the identity that is current at write time.
              user_id: userIdRef.current,
              date: op.log.date,
              food_id: op.log.food_id,
              quantity: op.log.quantity,
              created_at: op.log.created_at,
            });

            if (error) {
              const duplicate =
                error.code === "23505" ||
                error.message?.toLowerCase().includes("duplicate");
              if (!duplicate) {
                console.warn("Nutrition write queued for retry:", error.message);
                remaining.push(op);
              }
            }
          } else {
            const { error } = await supabase
              .from("daily_logs")
              .delete()
              .eq("id", op.logId)
              .eq("user_id", userIdRef.current);

            if (error) remaining.push(op);
          }
        } catch (error) {
          remaining.push(op);
          if (isTransientNetworkError(error)) {
            remaining.push(
              ...pendingRef.current.slice(
                pendingRef.current.indexOf(op) + 1
              )
            );
            break;
          }
        }
      }

      pendingRef.current = remaining;
      persist();
    } finally {
      flushingRef.current = false;
    }
  }, [authLoading, persist]);

  const getLogsByDate = useCallback(
    async (date: string) => {
      setCurrentDate(date);
      currentDateRef.current = date;
      hydrateFromCache(date);

      const cached = logsByDateRef.current[date] || [];
      if (cached.length === 0) setLoading(true);

      const remote = await fetchRemoteLogs(date);
      if (!mountedRef.current) return;

      if (remote) {
        const merged = mergeLogs(remote, logsByDateRef.current[date] || [], pendingRef.current);
        applyLogs(date, merged);
        void flushPending();
      }

      setLoading(false);
    },
    [applyLogs, fetchRemoteLogs, flushPending, hydrateFromCache]
  );

  const getTodayLogs = useCallback(async () => {
    await getLogsByDate(getTodayKey());
  }, [getLogsByDate]);

  const addFoodLog = useCallback(
    async (food: FoodItem, quantity: number) => {
      const today = getTodayKey();
      const optimistic: DailyLog = {
        id: crypto.randomUUID(),
        user_id: userIdRef.current,
        date: today,
        food_id: food.id,
        quantity: Number(quantity) || 1,
        created_at: new Date().toISOString(),
        food,
      };

      setCurrentDate(today);
      currentDateRef.current = today;

      const nextLogs = [optimistic, ...(logsByDateRef.current[today] || [])];
      applyLogs(today, nextLogs);
      pendingRef.current = [...pendingRef.current, { kind: "insert", log: optimistic }];
      persist();

      // Write straight through to Supabase, then re-read from it so the server
      // row (not just the optimistic/local copy) is the source of truth.
      await flushPending();
      await getTodayLogs();
    },
    [applyLogs, flushPending, getTodayLogs, persist]
  );

  const deleteFoodLog = useCallback(
    async (logId: string) => {
      const date = currentDateRef.current;
      const remainingLogs = (logsByDateRef.current[date] || []).filter(
        (log) => log.id !== logId
      );
      applyLogs(date, remainingLogs);

      // Keep any in-flight insert, then enqueue delete so the server
      // still drops the row if the insert already landed.
      pendingRef.current = [
        ...pendingRef.current.filter(
          (op) => !(op.kind === "delete" && op.logId === logId)
        ),
        { kind: "delete", logId },
      ];
      persist();
      void flushPending();
    },
    [applyLogs, flushPending, persist]
  );

  const dailyTotals = useMemo(
    () => totalsFromLogs(currentDate, dailyLogs),
    [currentDate, dailyLogs]
  );

  useEffect(() => {
    // Wait for the session lookup to settle before touching the database, so
    // the first read (and any write) always uses the resolved user id instead
    // of the single-user placeholder.
    if (authLoading) return;

    mountedRef.current = true;
    hydrateFromCache(getTodayKey());
    // Intentional fetch-on-mount; toggling loading state here is by design.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void getTodayLogs();

    const retry = () => {
      void flushPending();
      void getLogsByDate(currentDateRef.current);
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") retry();
    };

    window.addEventListener("online", retry);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("online", retry);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId, authLoading, flushPending, getLogsByDate, getTodayLogs, hydrateFromCache]);

  return (
    <NutritionContext.Provider
      value={{
        dailyLogs,
        dailyTotals,
        loading,
        addFoodLog,
        deleteFoodLog,
        getTodayLogs,
        getLogsByDate,
      }}
    >
      {children}
    </NutritionContext.Provider>
  );
}

export function useNutrition() {
  const context = useContext(NutritionContext);
  if (context === undefined) {
    throw new Error("useNutrition must be used within a NutritionProvider");
  }
  return context;
}
