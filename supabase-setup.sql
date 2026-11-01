-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create foods table with INTEGER primary key
CREATE TABLE IF NOT EXISTS foods (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  name_myanmar TEXT NOT NULL,
  icon TEXT NOT NULL,
  calories NUMERIC NOT NULL,
  protein NUMERIC NOT NULL,
  carbs NUMERIC NOT NULL,
  fat NUMERIC NOT NULL,
  default_quantity INTEGER NOT NULL,
  unit TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_logs table (relaxed for single-user app)
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000000', -- Default fallback UUID for single-user app
  date TEXT NOT NULL, -- YYYY-MM-DD format
  food_id INTEGER REFERENCES foods(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster date queries
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, date);

-- Insert quick add foods with INTEGER IDs
INSERT INTO foods (id, name, name_myanmar, icon, calories, protein, carbs, fat, default_quantity, unit)
VALUES
  (1, 'Banana', 'ငှက်ပျောသီး', '🍌', 89, 1.1, 22.8, 0.3, 3, 'units'),
  (2, 'Sweet Potato', 'ကန်စွန်းဥ', '🍠', 86, 1.6, 20.1, 0.1, 1, 'unit'),
  (3, 'Eggs', 'ကြက်ဥ', '🥚', 78, 6.3, 0.6, 5.3, 2, 'units')
ON CONFLICT (id) DO UPDATE SET
  icon = EXCLUDED.icon,
  name = EXCLUDED.name,
  name_myanmar = EXCLUDED.name_myanmar,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  default_quantity = EXCLUDED.default_quantity,
  unit = EXCLUDED.unit;

-- Row Level Security (RLS) policies - relaxed for single-user app
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view logs (single-user app)
CREATE POLICY "Allow all to view logs"
  ON daily_logs FOR SELECT
  USING (true);

-- Allow anyone to insert logs (single-user app)
CREATE POLICY "Allow all to insert logs"
  ON daily_logs FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update logs (single-user app)
CREATE POLICY "Allow all to update logs"
  ON daily_logs FOR UPDATE
  USING (true);

-- Allow anyone to delete logs (single-user app)
CREATE POLICY "Allow all to delete logs"
  ON daily_logs FOR DELETE
  USING (true);

-- Foods are publicly readable
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Foods are publicly readable"
  ON foods FOR SELECT
  USING (true);
