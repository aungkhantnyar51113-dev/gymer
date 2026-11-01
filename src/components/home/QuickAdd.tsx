"use client";

import { useMemo, useState } from "react";
import { QUICK_ADD_FOODS } from "@/lib/foods";
import { FoodItem } from "@/lib/types";
import { useNutrition } from "@/contexts/NutritionContext";
import { isSupabaseConfigured } from "@/lib/supabase";

export function QuickAdd() {
  const { addFoodLog } = useNutrition();
  const [addedFood, setAddedFood] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  // Case-insensitive match across both the English and Myanmar names.
  const filteredFoods = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return QUICK_ADD_FOODS;
    return QUICK_ADD_FOODS.filter(
      (food) =>
        food.name.toLowerCase().includes(q) ||
        food.name_myanmar.toLowerCase().includes(q)
    );
  }, [query]);

  if (!isSupabaseConfigured) {
    return (
      <section aria-labelledby="quick-add-heading" className="mt-6">
        <div className="mb-3">
          <h2 id="quick-add-heading" className="text-base font-semibold">
            Quick Add / Daily Essentials
          </h2>
        </div>
        <div className="rounded-2xl border border-line bg-card p-4 shadow-sm">
          <p className="text-sm text-muted">
            Please configure Supabase to enable food tracking. See SETUP.md for instructions.
          </p>
        </div>
      </section>
    );
  }

  const handleQuickAdd = async (food: FoodItem) => {
    setAddedFood(food.id);
    setTimeout(() => setAddedFood(null), 1500);
    try {
      await addFoodLog(food, food.default_quantity);
    } catch {
      // Network failures are handled silently in NutritionContext.
    }
  };

  return (
    <section aria-labelledby="quick-add-heading" className="mt-6">
      <div className="mb-3">
        <h2 id="quick-add-heading" className="text-base font-semibold">
          Quick Add / Daily Essentials
        </h2>
        <p className="text-xs text-muted">Tap to log your daily staples</p>
      </div>

      <div className="relative mb-3">
        <span
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </span>

        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search food / အစားအသောက် ရှာရန်"
          aria-label="Search food"
          autoComplete="off"
          className="w-full rounded-2xl border border-line bg-card py-3 pl-10 pr-10 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20"
        />

        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted transition hover:bg-brand-soft/60 hover:text-foreground"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {filteredFoods.length === 0 ? (
        <div
          role="status"
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-card px-4 py-10 text-center shadow-sm"
        >
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft/50 text-xl">
            🔍
          </span>
          <p className="text-sm font-medium text-foreground">Food not found</p>
          <p className="mt-0.5 text-sm text-foreground">ရှာမတွေ့ပါ။</p>
          <p className="mt-2 text-xs text-muted">
            No results for &ldquo;{query.trim()}&rdquo; — try another name.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {filteredFoods.map((food) => {
            const isAdded = addedFood === food.id;
            return (
              <button
                key={food.id}
                onClick={() => handleQuickAdd(food)}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 shadow-sm transition active:scale-[0.98] ${
                  isAdded
                    ? "border-brand bg-brand-soft/60"
                    : "border-line bg-card hover:border-brand/30 hover:bg-brand-soft/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{food.icon}</span>
                  <div className="text-left">
                    <span className="block text-sm font-medium text-foreground">
                      {food.name_myanmar}
                    </span>
                    <span className="block text-xs text-muted">{food.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  {isAdded ? (
                    <span className="block text-sm font-semibold text-brand">
                      ✓ Added
                    </span>
                  ) : (
                    <>
                      <span className="block text-sm font-semibold text-brand">
                        {(food.calories * food.default_quantity).toFixed(0)} kcal
                      </span>
                      <span className="block text-xs text-muted">
                        {food.default_quantity} {food.unit}
                      </span>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
