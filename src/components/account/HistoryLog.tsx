"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { DAILY_TARGETS } from "@/lib/targets";
import { totalsFromLogs } from "@/lib/nutrition";
import {
  formatDateLabel,
  getRecentDateKeys,
  getRelativeDayLabel,
} from "@/lib/dates";
import type { DailyLog, DailyTotals, FoodItem } from "@/lib/types";

const HISTORY_DAYS = 14;

type MacroMeta = {
  label: string;
  target: number;
  unit: string;
  decimals: number;
  barClass: string;
  read: (totals: DailyTotals) => number;
};

const MACROS: MacroMeta[] = [
  {
    label: "Calories",
    target: DAILY_TARGETS.calories,
    unit: "kcal",
    decimals: 0,
    barClass: "bg-brand",
    read: (totals) => totals.totalCalories,
  },
  {
    label: "Protein",
    target: DAILY_TARGETS.protein,
    unit: "g",
    decimals: 1,
    barClass: "bg-accent",
    read: (totals) => totals.totalProtein,
  },
  {
    label: "Carbs",
    target: DAILY_TARGETS.carbs,
    unit: "g",
    decimals: 1,
    barClass: "bg-amber-500",
    read: (totals) => totals.totalCarbs,
  },
  {
    label: "Fat",
    target: DAILY_TARGETS.fat,
    unit: "g",
    decimals: 1,
    barClass: "bg-rose-500",
    read: (totals) => totals.totalFat,
  },
];

type DaySummary = {
  date: string;
  label: string;
  relative: string | null;
  totals: DailyTotals;
  entries: DailyLog[];
};

/**
 * Pulls the last `HISTORY_DAYS` days of logs in one range query and groups
 * them by date in memory, so the account page needs two round trips total
 * (logs + the food rows they reference) regardless of how many days exist.
 */
async function fetchHistory(
  client: SupabaseClient,
  userId: string
): Promise<DaySummary[]> {
  const dateKeys = getRecentDateKeys(HISTORY_DAYS);
  const newest = dateKeys[0];
  const oldest = dateKeys[dateKeys.length - 1];

  const { data, error } = await client
    .from("daily_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("date", oldest)
    .lte("date", newest)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows: Array<Record<string, unknown>> = data ?? [];
  const rowsByDate = new Map<string, Array<Record<string, unknown>>>();
  for (const row of rows) {
    const key = String(row.date);
    const bucket = rowsByDate.get(key);
    if (bucket) {
      bucket.push(row);
    } else {
      rowsByDate.set(key, [row]);
    }
  }

  // Resolve every referenced food in a single query.
  const foodIds = [
    ...new Set(
      rows
        .map((row) => Number(row.food_id))
        .filter((id) => !Number.isNaN(id))
    ),
  ];

  const foodMap = new Map<number, FoodItem>();
  if (foodIds.length > 0) {
    const { data: foods, error: foodsError } = await client
      .from("foods")
      .select("*")
      .in("id", foodIds);

    if (foodsError) throw foodsError;

    for (const food of (foods ?? []) as FoodItem[]) {
      foodMap.set(food.id, food);
    }
  }

  return dateKeys
    .map<DaySummary>((date) => {
      const entries: DailyLog[] = (rowsByDate.get(date) ?? []).map((row) => {
        const foodId = Number(row.food_id);
        return {
          id: String(row.id),
          user_id: String(row.user_id),
          // Prefer `date`, fall back to `logged_date` (both exist on the table).
          date: String(row.date ?? row.logged_date ?? date),
          food_id: foodId,
          quantity: Number(row.quantity) || 0,
          created_at: String(row.created_at),
          food: foodMap.get(foodId),
        };
      });

      return {
        date,
        label: formatDateLabel(date),
        relative: getRelativeDayLabel(date),
        totals: totalsFromLogs(date, entries),
        entries,
      };
    })
    .filter((day) => day.entries.length > 0);
}

export function HistoryLog() {
  const { user } = useAuth();
  // `null` until the session resolves; queries below are gated on a real id.
  const userId = user?.id ?? null;

  const [days, setDays] = useState<DaySummary[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // No query — not even a SELECT — until a real authenticated user exists.
    if (!isSupabaseConfigured || !supabase || !userId) return;

    const client = supabase;
    let active = true;

    const load = async () => {
      try {
        const summaries = await fetchHistory(client, userId);
        if (!active) return;
        setDays(summaries);
        setStatus("ready");
      } catch {
        if (!active) return;
        setDays([]);
        setStatus("error");
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [userId, reloadKey]);

  if (!isSupabaseConfigured) return null;

  const handleRetry = () => {
    setStatus("loading");
    setReloadKey((key) => key + 1);
  };

  const toggleDay = (date: string) => {
    setExpanded((current) => ({ ...current, [date]: !current[date] }));
  };

  return (
    <section aria-labelledby="history-heading">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Last {HISTORY_DAYS} days
          </p>
          <h2 id="history-heading" className="text-base font-semibold">
            Food History
          </h2>
        </div>
        {status === "ready" && days.length > 0 && (
          <span className="text-xs text-muted">
            {days.length} day{days.length === 1 ? "" : "s"} logged
          </span>
        )}
      </div>

      {status === "loading" ? (
        <div className="space-y-2" aria-hidden="true">
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="h-24 animate-pulse rounded-2xl border border-line bg-card"
            />
          ))}
        </div>
      ) : status === "error" ? (
        <div className="rounded-2xl border border-line bg-card p-5 text-center shadow-sm">
          <p className="text-sm font-medium text-foreground">
            Could not load your history
          </p>
          <p className="mt-1 text-xs text-muted">
            Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-3 rounded-xl border border-line bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:border-brand/30 hover:bg-brand-soft/30 active:scale-[0.98]"
          >
            Retry
          </button>
        </div>
      ) : days.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-card px-4 py-10 text-center shadow-sm">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft/50 text-xl">
            📋
          </span>
          <p className="text-sm font-medium text-foreground">No history yet</p>
          <p className="mt-0.5 text-sm text-foreground">
            မှတ်တမ်း မရှိသေးပါ။
          </p>
          <p className="mt-2 text-xs text-muted">
            Food you log on the home page will show up here, day by day.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {days.map((day) => {
            const isOpen = Boolean(expanded[day.date]);

            return (
              <li
                key={day.date}
                className="overflow-hidden rounded-2xl border border-line bg-card shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleDay(day.date)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 px-4 pt-3 text-left transition hover:bg-brand-soft/30"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {day.label}
                      </span>
                      {day.relative && (
                        <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                          {day.relative}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {day.entries.length}{" "}
                      {day.entries.length === 1 ? "entry" : "entries"}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold text-brand">
                      {Math.round(day.totals.totalCalories)} kcal
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className={`h-4 w-4 text-muted transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </button>

                <div className="space-y-2 px-4 pb-3 pt-2.5">
                  {MACROS.map((macro) => {
                    const value = macro.read(day.totals);
                    const percent =
                      macro.target > 0
                        ? Math.min(100, (value / macro.target) * 100)
                        : 0;

                    return (
                      <div key={macro.label}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted">{macro.label}</span>
                          <span className="font-medium text-foreground">
                            {value.toFixed(macro.decimals)}
                            <span className="text-muted">
                              {" / "}
                              {macro.target} {macro.unit}
                            </span>
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-line">
                          <div
                            className={`h-full rounded-full transition-all ${macro.barClass}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {isOpen && (
                  <div className="border-t border-line px-4 py-3">
                    <ul className="space-y-2">
                      {day.entries.map((entry) => {
                        const food = entry.food;
                        const quantity = Number(entry.quantity) || 0;
                        const calories =
                          (Number(food?.calories) || 0) * quantity;

                        return (
                          <li
                            key={entry.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-line bg-background px-3 py-2"
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              <span className="text-lg">
                                {food?.icon || "🍽️"}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {food?.name_myanmar ||
                                    food?.name ||
                                    "Unknown food"}
                                </p>
                                <p className="truncate text-xs text-muted">
                                  {food?.name ? `${food.name} · ` : ""}
                                  {quantity} {food?.unit || "units"}
                                </p>
                              </div>
                            </div>
                            <span className="shrink-0 text-sm font-semibold text-brand">
                              {calories.toFixed(0)} kcal
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
