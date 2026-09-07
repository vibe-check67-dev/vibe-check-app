-- ====================================================================
-- 004_multi_checkin_and_notification_settings.sql
-- 
-- 1. Support multiple check-ins per day:
--    - Add `checkin_time` (time) column to `mood_checkins`
--    - Ensure no unique constraint restricts users to 1 check-in per day
-- 2. Client-side notification scheduling settings:
--    - Create `notification_settings` table for storing user reminder times
--    - Setup Row Level Security (RLS) policies
-- 
-- INSTRUCTIONS:
-- Copy and run this script in your Supabase Dashboard -> SQL Editor
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. MOOD_CHECKINS: Add checkin_time & drop single-checkin constraints
-- --------------------------------------------------------------------
ALTER TABLE public.mood_checkins 
  ADD COLUMN IF NOT EXISTS checkin_time time DEFAULT NULL;

-- If any unique constraint or unique index on checkin_date exists from previous setups, drop it:
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop unique constraints on mood_checkins involving checkin_date
  FOR r IN (
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'public.mood_checkins'::regclass 
      AND contype = 'u' 
      AND (conname LIKE '%checkin_date%' OR conname LIKE '%mood_checkins_user%')
  ) LOOP
    EXECUTE 'ALTER TABLE public.mood_checkins DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;

  -- Drop standalone unique indexes on mood_checkins involving checkin_date
  FOR r IN (
    SELECT indexname 
    FROM pg_indexes 
    WHERE tablename = 'mood_checkins' 
      AND schemaname = 'public'
      AND indexdef LIKE '%UNIQUE%checkin_date%'
  ) LOOP
    EXECUTE 'DROP INDEX IF EXISTS public.' || quote_ident(r.indexname);
  END LOOP;
END $$;

-- Add index on (user_id, checkin_date, checkin_time) for high-performance timeline queries
CREATE INDEX IF NOT EXISTS idx_mood_checkins_user_timeline 
  ON public.mood_checkins (user_id, checkin_date DESC, checkin_time ASC);

CREATE INDEX IF NOT EXISTS idx_mood_checkins_date_time 
  ON public.mood_checkins (checkin_date DESC, checkin_time ASC);

-- Backfill existing historical check-ins with time from created_at
UPDATE public.mood_checkins 
  SET checkin_time = (created_at AT TIME ZONE 'Asia/Bangkok')::time 
  WHERE checkin_time IS NULL AND created_at IS NOT NULL;

-- --------------------------------------------------------------------
-- 2. NOTIFICATION_SETTINGS: User reminder preferences table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  enabled boolean DEFAULT true,
  reminder_times jsonb DEFAULT '["07:00","18:00"]'::jsonb,
  timezone text DEFAULT 'auto',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can manage own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Admin can read all notification settings" ON public.notification_settings;

-- RLS Policy: Users can read, insert, update their own settings
CREATE POLICY "Users can manage own notification settings"
  ON public.notification_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Admin can read all notification settings
CREATE POLICY "Admin can read all notification settings"
  ON public.notification_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Fast lookup index
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id 
  ON public.notification_settings (user_id);
