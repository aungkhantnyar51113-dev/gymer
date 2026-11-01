export interface FoodItem {
  id: number;
  name: string;
  name_myanmar: string;
  icon: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  default_quantity: number;
  unit: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD format
  food_id: number;
  quantity: number;
  created_at: string;
  food?: FoodItem;
}

export interface DailyTotals {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}
