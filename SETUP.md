# Gymer App - Setup Guide

This guide will help you set up the Supabase backend for the Gymer fitness tracking app.

## Prerequisites

- A Supabase account (free tier works)
- Node.js and npm installed

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in the project details:
   - Name: `gymer` (or your preferred name)
   - Database Password: Choose a strong password (save it!)
   - Region: Choose the closest region to you
5. Click "Create new project"
6. Wait for the project to be provisioned (2-3 minutes)

## Step 2: Get Your Supabase Credentials

1. Go to your project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - `Project URL` (e.g., `https://xxxxxxxx.supabase.co`)
   - `anon public key` (the long string under "Project API keys")

## Step 3: Configure Environment Variables (CRITICAL)

1. Create a `.env.local` file in the root of your project (this file is already in `.gitignore`)
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**IMPORTANT:** Replace the placeholder values with your actual credentials from Step 2. Without these, the app will show "Please configure Supabase" and food tracking will not work.

## Step 4: Set Up the Database

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (icon looks like a terminal in the left sidebar)
3. Click "New Query"
4. Copy the contents of `supabase-setup.sql` from the project root
5. Paste it into the SQL Editor
6. Click "Run" (or press Ctrl+Enter)

This will:
- Create the necessary tables (`foods`, `daily_logs`)
- Set up relaxed Row Level Security (RLS) policies for single-user app
- Insert the quick-add food items (Banana, Sweet Potato, Eggs) with icons
- Create indexes for performance
- Set a default user_id for single-user mode

**Important:** If you've already run the SQL setup before, run it again to update the tables with the relaxed RLS policies, icon column, and default user_id.

## Step 5: Restart the Development Server

After configuring `.env.local`, you must restart the dev server:

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

The app will start at `http://localhost:3000`

## Step 6: Test the Application

The app is designed as a **single-user app** and works without authentication:

1. Open `http://localhost:3000` in your browser
2. On the home dashboard, you should see:
   - Today's Nutrition section (showing 0 initially)
   - Quick Add / Daily Essentials section with three buttons with food icons
3. Tap any quick-add button (e.g., "🍌 ငှက်ပျောသီး" for Banana)
4. The nutrition totals should update immediately with the calories and macros
5. Navigate to the "Nutrients" tab to view your food log list and delete entries

**Optional Authentication:**
- If you want to sync data across devices, you can sign in via the Account page
- Authentication is completely optional for single-user usage
- The app works seamlessly whether you're signed in or not

## Food Items Included

The Quick Add section includes:

| Icon | Food (Myanmar) | Food (English) | Default Qty | Calories | Protein | Carbs | Fat |
|------|---------------|----------------|-------------|----------|---------|-------|-----|
| 🍌 | ငှက်ပျောသီး | Banana | 3 units | 267 kcal | 3.3g | 68.4g | 0.9g |
| 🍠 | ကန်စွန်းဥ | Sweet Potato | 1 unit | 86 kcal | 1.6g | 20.1g | 0.1g |
| 🥚 | ကြက်ဥ | Eggs | 2 units | 156 kcal | 12.6g | 1.2g | 10.6g |

## Database Schema

### `foods` table
- Stores food nutritional information with icons
- Pre-populated with quick-add items
- Columns: `id`, `name`, `name_myanmar`, `icon`, `calories`, `protein`, `carbs`, `fat`, `default_quantity`, `unit`

### `daily_logs` table
- Stores daily food intake logs
- Tracks date in YYYY-MM-DD format
- `user_id` has a default fallback UUID for single-user app
- Columns: `id`, `user_id` (with default), `date`, `food_id`, `quantity`, `created_at`

## Single-User Mode

This app is designed as a personal single-user fitness tracker:

- **No authentication required**: Works immediately after setup
- **Optional sign-in**: Use authentication only if you want multi-device sync
- **Relaxed RLS policies**: Database allows all operations for simplicity
- **Data isolation**: If you sign in, data is filtered by user; otherwise, all data is accessible

## Features

### Home Dashboard
- **Today's Nutrition**: Shows daily totals for calories, protein, carbs, and fat
- **Quick Add / Daily Essentials**: One-tap buttons to log staple foods with visual icons
- **Daily Missions**: Track daily habits and goals

### Nutrients Page
- **Nutrition Overview**: Summary of today's nutritional intake
- **Food Entries**: List of all logged food items with:
  - Food icon and name (Myanmar & English)
  - Quantity consumed
  - Total calories and macros per entry
  - Delete button to remove entries

### Account Page
- **Optional authentication**: Sign in for multi-device sync
- Works perfectly without signing in for single-user usage

## Troubleshooting

### "Please configure Supabase" message
- **Most common issue**: `.env.local` file is missing or doesn't have credentials
- Create `.env.local` file in the project root
- Add your Supabase URL and anon key
- **Restart the dev server** after adding credentials
- Verify the file is not in `.gitignore` (it should be, but check if it exists)

### "Failed to fetch" errors
- Supabase credentials are not configured correctly
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Ensure your Supabase project is active (not paused)
- Restart the dev server after fixing credentials

### "column daily_logs.date does not exist"
- Database schema hasn't been updated
- Run the updated `supabase-setup.sql` in Supabase SQL Editor
- This adds the `date` column and other updates

### "Failed to add food" error
- Check the browser console for specific error messages
- Verify the database tables were created successfully in the SQL Editor
- Make sure you've run the updated SQL setup
- Ensure the `foods` table has the `icon` column

### Nutrition totals not updating
- Refresh the page
- Check the browser console for errors
- Verify the SQL setup was completed successfully
- Ensure the `foods` table has the `icon` column

### Icons not showing
- Run the updated `supabase-setup.sql` to add the `icon` column to the `foods` table
- Check that the foods have emoji icons in the database

### Authentication errors
- Authentication is optional - the app works without it
- If you want to use authentication, ensure Email provider is enabled in Supabase
- Check your `.env.local` has valid Supabase credentials

## Next Steps

Future enhancements could include:
- Custom food entry with image upload
- Food search database
- Calorie goals and progress tracking
- Historical data visualization by date
- Meal planning features
- Nutrition insights and recommendations
