-- ====================================================================
-- 006_discord_notifications.sql
-- 
-- 1. กู้คืนสิทธิ์ Admin สำหรับบัญชี boss.apichai01@gmail.com
-- 2. เพิ่มคอลัมน์ discord_id ลงในตาราง notification_settings
-- 3. สร้าง Index เพื่อเพิ่มความเร็วในการค้นหาผู้ใช้ที่ตั้งค่า Discord
-- 
-- คำแนะนำขั้นตอนการใช้งาน:
-- --------------------------------------------------------------------
-- 1. เข้าสู่ระบบ https://supabase.com แล้วเลือก Project ของคุณ
-- 2. ไปที่เมนู "SQL Editor" จากแถบเมนูด้านซ้าย
-- 3. คัดลอกคำสั่ง SQL ทั้งหมดด้านล่างนี้ไปวาง แล้วกด "Run"
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. กู้คืนสิทธิ์ Admin สำหรับ boss.apichai01@gmail.com
-- --------------------------------------------------------------------
-- อัปเดตสิทธิ์ใน profiles เป็น admin
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'boss.apichai01@gmail.com';

-- หาก profiles ยังไม่มีแถวข้อมูลของอีเมลนี้ (แต่มีใน auth.users) ให้แทรกข้อมูลพร้อมสิทธิ์ admin ทันที
INSERT INTO public.profiles (id, email, display_name, role)
SELECT id, email, coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), 'admin'
FROM auth.users
WHERE email = 'boss.apichai01@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- ตรวจสอบผลการอัพเดทสิทธิ์
SELECT id, email, role, display_name 
FROM public.profiles 
WHERE email = 'boss.apichai01@gmail.com';

-- --------------------------------------------------------------------
-- 2. เพิ่มคอลัมน์ discord_id ใน notification_settings
-- --------------------------------------------------------------------
ALTER TABLE public.notification_settings 
  ADD COLUMN IF NOT EXISTS discord_id text DEFAULT NULL;

-- เพิ่ม Index สำหรับค้นหา discord_id
CREATE INDEX IF NOT EXISTS idx_notification_settings_discord_id 
  ON public.notification_settings (discord_id);

-- ยืนยันโครงสร้างตาราง
COMMENT ON COLUMN public.notification_settings.discord_id IS 'Discord User Snowflake ID for DM notifications';

-- --------------------------------------------------------------------
-- 3. (แนะนำ) ตั้งเวลา Hourly Cron ใน Supabase pg_cron (รันส่งแจ้งเตือนทุก 1 ชม.)
-- --------------------------------------------------------------------
-- หมายเหตุ: หากต้องการใช้ pg_cron ให้แทนที่ <YOUR_APP_DOMAIN> ด้วยโดเมน Vercel ของคุณ
-- และแทนที่ <YOUR_CRON_SECRET> ด้วย Secret ที่คุณตั้งไว้ใน Vercel (ถ้ามี)
--
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- CREATE EXTENSION IF NOT EXISTS pg_net;
--
-- SELECT cron.unschedule('vibe-check-hourly-reminder') 
-- WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'vibe-check-hourly-reminder');
--
-- SELECT cron.schedule(
--   'vibe-check-hourly-reminder',
--   '0 * * * *',
--   $$
--   SELECT net.http_get(
--     url := 'https://<YOUR_APP_DOMAIN>.vercel.app/api/notifications/send-reminder'
--   );
--   $$
-- );
