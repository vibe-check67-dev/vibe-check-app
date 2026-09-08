-- ====================================================================
-- 005_push_cron_setup.sql
-- 
-- ตั้งเวลาส่งแจ้งเตือน Web Push อัตโนมัติทุก 1 ชั่วโมง (ฟรี 100%)
-- ปลุกหน้าจอมือถือ/คอมพิวเตอร์ แม้จะปิดเว็บหรือปิดหน้าจอไปแล้ว
-- 
-- คำแนะนำขั้นตอนการตั้งค่าใน Supabase Dashboard:
-- --------------------------------------------------------------------
-- 1. ไปที่เมนู Database -> Extensions
-- 2. ค้นหา "pg_cron" แล้วกด Enable (เปิดใช้งาน)
-- 3. ค้นหา "pg_net" แล้วกด Enable (เปิดใช้งาน)
-- 4. ไปที่เมนู SQL Editor แล้วเลือกวิธีที่ต้องการใช้งานด้านล่างนี้
-- ====================================================================

-- เปิดใช้งาน Extensions (หรือกดเปิดในหน้า Dashboard Extensions)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ====================================================================
-- วิธีที่ 1 (แนะนำและง่ายที่สุด): ให้ pg_cron เรียก Vercel API ของคุณ
-- ====================================================================
-- แก้ไข <YOUR_APP_DOMAIN> เป็นโดเมน Vercel ของคุณ 
-- เช่น https://vibe-check-app.vercel.app/api/notifications/send-reminder

-- ลบ job เก่าหากเคยสร้างไว้
SELECT cron.unschedule('vibe-check-hourly-reminder') 
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'vibe-check-hourly-reminder');

-- ตั้งเวลาให้รันทุกนาทีที่ 0 ของทุกชั่วโมง (0 * * * *)
SELECT cron.schedule(
  'vibe-check-hourly-reminder',
  '0 * * * *',
  $$
  SELECT net.http_get(
    url := 'https://<YOUR_APP_DOMAIN>.vercel.app/api/notifications/send-reminder'
  );
  $$
);

-- ====================================================================
-- วิธีที่ 2 (ทางเลือก): หากต้องการเรียก Supabase Edge Function
-- ====================================================================
-- ใช้เมื่อคุณ deploy Edge Function `send-push-reminder` ขึ้น Supabase
--
-- SELECT cron.unschedule('vibe-check-edge-function-reminder') 
-- WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'vibe-check-edge-function-reminder');
--
-- SELECT cron.schedule(
--   'vibe-check-edge-function-reminder',
--   '0 * * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-push-reminder',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer <SUPABASE_SERVICE_ROLE_KEY>',
--       'Content-Type', 'application/json'
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );

-- ====================================================================
-- คำสั่งตรวจสอบการทำงาน (Useful Monitoring Queries):
-- ====================================================================
-- 1. ดูรายการ Cron Job ทั้งหมดที่ตั้งไว้:
-- SELECT jobid, jobname, schedule, active FROM cron.job;

-- 2. ดูประวัติการรันล่าสุด (ดูว่าสำเร็จไหม):
-- SELECT jobid, runid, job_pid, status, return_message, start_time, end_time 
-- FROM cron.job_run_details 
-- ORDER BY start_time DESC 
-- LIMIT 10;
