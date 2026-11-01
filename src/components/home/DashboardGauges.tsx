"use client";

import { ProgressRing } from "@/components/home/ProgressRing";
import { TodayDate } from "@/components/home/TodayDate";
import { useNutrition } from "@/contexts/NutritionContext";
import { DAILY_TARGETS } from "@/lib/targets";

type DashboardGaugesProps = {
  exercisesCompleted: number;
  exercisesTotal: number;
};

export function DashboardGauges({
  exercisesCompleted,
  exercisesTotal,
}: DashboardGaugesProps) {
  const { dailyTotals } = useNutrition();
  const caloriesConsumed = Math.round(dailyTotals?.totalCalories ?? 0);

  return (
    <section aria-labelledby="today-progress-heading">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Today
          </p>
          <h2 id="today-progress-heading" className="text-base font-semibold">
            Daily progress
          </h2>
        </div>
        <TodayDate />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ProgressRing
          label="Today Target"
          current={caloriesConsumed}
          total={DAILY_TARGETS.calories}
          tone="brand"
        />
        <ProgressRing
          label="Today Exercises"
          current={exercisesCompleted}
          total={exercisesTotal}
          tone="accent"
        />
      </div>
    </section>
  );
}
