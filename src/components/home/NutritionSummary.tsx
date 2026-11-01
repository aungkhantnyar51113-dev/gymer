"use client";

import { useNutrition } from "@/contexts/NutritionContext";
import { isSupabaseConfigured } from "@/lib/supabase";

export function NutritionSummary() {
  const { dailyTotals, loading } = useNutrition();

  if (!isSupabaseConfigured) {
    return null;
  }

  if (loading && !dailyTotals) {
    return (
      <section aria-labelledby="nutrition-heading" className="mt-6">
        <h2 id="nutrition-heading" className="text-base font-semibold mb-3">
          Today&apos;s Nutrition
        </h2>
        <div className="rounded-2xl border border-line bg-card p-4 shadow-sm">
          <p className="text-sm text-muted">Loading...</p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="nutrition-heading" className="mt-6">
      <h2 id="nutrition-heading" className="text-base font-semibold mb-3">
        Today&apos;s Nutrition
      </h2>
      <div className="rounded-2xl border border-line bg-card p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted uppercase tracking-wider">Calories</p>
            <p className="mt-1 text-2xl font-semibold text-brand">
              {(dailyTotals?.totalCalories || 0).toFixed(0)}
              <span className="text-sm font-medium text-muted"> kcal</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted uppercase tracking-wider">Protein</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {(dailyTotals?.totalProtein || 0).toFixed(1)}
              <span className="text-sm font-medium text-muted"> g</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted uppercase tracking-wider">Carbs</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {(dailyTotals?.totalCarbs || 0).toFixed(1)}
              <span className="text-sm font-medium text-muted"> g</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted uppercase tracking-wider">Fat</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {(dailyTotals?.totalFat || 0).toFixed(1)}
              <span className="text-sm font-medium text-muted"> g</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
