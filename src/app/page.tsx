"use client";

import { useCallback, useEffect, useState } from "react";
import { DailyMissions, type Mission } from "@/components/home/DailyMissions";
import { DashboardGauges } from "@/components/home/DashboardGauges";
import { QuickAdd } from "@/components/home/QuickAdd";
import { NutritionSummary } from "@/components/home/NutritionSummary";
import { useAuth } from "@/contexts/AuthContext";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { getTodayKey } from "@/lib/dates";

const DAILY_MISSIONS: Mission[] = [
  { id: "stretch", title: "Eat 2 plane bread", hint: "Mobility" },
  { id: "water", title: "Eat 3 Bananas", hint: "Hydration" },
  { id: "diet", title: "Eat 3 boiled Egg", hint: "Proper diet" },
  { id: "steps", title: "Eat 1 sweet potato", hint: "Daily habit" },
  
  { id: "sleep", title: "Eat 100g protein per day", hint: "Recovery" },
];

export default function Home() {
  const { user } = useAuth();
  // `null` until the session resolves; the placeholder UUID is never used.
  const userId = user?.id ?? null;

  // Single source of truth for mission completion. Lifted here so the
  // "Today Exercises" ring and the "Daily Mission" list stay in sync.
  const [missionProgress, setMissionProgress] = useState<
    Record<string, boolean>
  >({});

  // Load today's saved missions whenever the owner changes (mount / sign-in).
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !userId) return;

    const client = supabase;
    let active = true;

    const loadMissions = async () => {
      const { data, error } = await client
        .from("user_missions")
        .select("mission_id, completed")
        .eq("user_id", userId)
        .eq("date", getTodayKey());

      if (!active) return;

      if (error) {
        console.warn("Mission fetch skipped:", error.message);
        return;
      }

      const saved: Record<string, boolean> = {};
      for (const row of data ?? []) {
        if (row.completed) saved[row.mission_id] = true;
      }
      setMissionProgress(saved);
    };

    void loadMissions();

    return () => {
      active = false;
    };
  }, [userId]);

  const completedMissions = DAILY_MISSIONS.filter(
    (mission) => missionProgress[mission.id]
  ).length;

  const toggleMission = useCallback(
    async (id: string) => {
      const date = getTodayKey();
      const nextChecked = !missionProgress[id];

      // Optimistic UI: update immediately so the rings react instantly.
      setMissionProgress((current) => {
        const next = { ...current };
        if (nextChecked) {
          next[id] = true;
        } else {
          delete next[id];
        }
        return next;
      });

      if (!isSupabaseConfigured || !supabase || !userId) return;

      const { error } = await supabase.from("user_missions").upsert(
        {
          user_id: userId,
          mission_id: id,
          date,
          completed: nextChecked,
        },
        { onConflict: "user_id,mission_id,date" }
      );

      if (error) {
        console.warn("Mission sync skipped:", error.message);
      }
    },
    [missionProgress, userId]
  );

  return (
    <div className="space-y-1">
      <DashboardGauges
        exercisesCompleted={completedMissions}
        exercisesTotal={DAILY_MISSIONS.length}
      />
      <NutritionSummary />
      <QuickAdd />
      <DailyMissions
        missions={DAILY_MISSIONS}
        progress={missionProgress}
        onToggle={toggleMission}
      />
    </div>
  );
}
