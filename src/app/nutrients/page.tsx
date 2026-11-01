"use client";

import { useNutrition } from "@/contexts/NutritionContext";
import { isSupabaseConfigured } from "@/lib/supabase";
import { DailyLog } from "@/lib/types";

export default function NutrientsPage() {
  const { dailyLogs, dailyTotals, loading, deleteFoodLog } = useNutrition();

  if (!isSupabaseConfigured) {
    return (
      <section className="rounded-2xl border border-line bg-card p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
          Setup Required
        </p>
        <h2 className="mt-1 text-lg font-semibold">Nutrients</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Please configure Supabase to enable nutrition tracking. See SETUP.md for instructions.
        </p>
      </section>
    );
  }

  const handleDelete = async (logId: string) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      try {
        await deleteFoodLog(logId);
      } catch {
        // Network failures are handled silently in NutritionContext.
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Daily Totals Card */}
      <section className="rounded-2xl border border-line bg-card p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Today&apos;s Summary
          </p>
          <h2 className="mt-1 text-lg font-semibold">Nutrition Overview</h2>
        </div>

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
      </section>

      {/* Food Log List */}
      <section className="rounded-2xl border border-line bg-card p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Today&apos;s Log
          </p>
          <h2 className="mt-1 text-lg font-semibold">Food Entries</h2>
        </div>

        {loading && dailyLogs.length === 0 ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : dailyLogs.length === 0 ? (
          <p className="text-sm text-muted">
            No food entries yet. Use Quick Add on the home page to log your meals.
          </p>
        ) : (
          <ul className="space-y-2">
            {dailyLogs.map((log: DailyLog) => {
              const food = log.food;
              if (!food) return null;

              const totalCalories = (Number(food.calories) || 0) * (Number(log.quantity) || 0);
              const totalProtein = (Number(food.protein) || 0) * (Number(log.quantity) || 0);
              const totalCarbs = (Number(food.carbs) || 0) * (Number(log.quantity) || 0);
              const totalFat = (Number(food.fat) || 0) * (Number(log.quantity) || 0);

              return (
                <li
                  key={log.id}
                  className="flex items-center justify-between rounded-xl border border-line bg-background px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{food.icon || '🍽️'}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {food.name_myanmar || food.name || 'Unknown Food'}
                      </p>
                      <p className="text-xs text-muted">
                        {food.name || ''} · {log.quantity} {food.unit || 'units'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-brand">
                        {totalCalories.toFixed(0)} kcal
                      </p>
                      <p className="text-xs text-muted">
                        P: {totalProtein.toFixed(1)}g · C: {totalCarbs.toFixed(1)}g · F: {totalFat.toFixed(1)}g
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted transition hover:border-red-500/50 hover:text-red-500 hover:bg-red-50"
                      aria-label="Delete entry"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                        />
                      </svg>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
