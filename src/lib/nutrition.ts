import { DailyLog, DailyTotals } from "./types";

export function emptyTotals(date: string): DailyTotals {
  return {
    date,
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
  };
}

/**
 * Sums a day's logs into macro totals. Shares the same math as the live
 * dashboard so historical numbers stay consistent with today's summary.
 */
export function totalsFromLogs(date: string, logs: DailyLog[]): DailyTotals {
  return logs.reduce<DailyTotals>((acc, log) => {
    const food = log.food;
    if (!food) return acc;

    const multiplier = Number(log.quantity) || 0;
    return {
      date,
      totalCalories:
        acc.totalCalories + (Number(food.calories) || 0) * multiplier,
      totalProtein:
        acc.totalProtein + (Number(food.protein) || 0) * multiplier,
      totalCarbs: acc.totalCarbs + (Number(food.carbs) || 0) * multiplier,
      totalFat: acc.totalFat + (Number(food.fat) || 0) * multiplier,
    };
  }, emptyTotals(date));
}
