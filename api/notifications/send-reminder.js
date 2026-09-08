import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BOHA5PjSz12Y2G_C9rRtT9MtfmNOI5WIP34dBHqgJbwgqPPB7U8V8CIcR59t3LlDq6rW1_n8HEwHWHXfDOXVJ48';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'oYX-PrNUcyyu1XhGrxsFy1A1kzS1nkBeGhVNC7iLz_w';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@vibecheck.app';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Missing Supabase credentials' });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  try {
    const now = new Date();
    const sendAll = req.query?.all === '1' || req.query?.all === 'true';

    // 1. Fetch all push subscriptions
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*');

    if (subError) throw subError;
    if (!subscriptions || subscriptions.length === 0) {
      return res.status(200).json({ message: 'No push subscriptions found', sent: 0 });
    }

    // 2. Fetch all user notification settings
    const { data: settingsList, error: settingsError } = await supabaseAdmin
      .from('notification_settings')
      .select('*');

    if (settingsError) {
      console.warn('Could not fetch notification_settings:', settingsError);
    }

    const settingsMap = new Map();
    (settingsList || []).forEach((s) => {
      settingsMap.set(s.user_id, s);
    });

    // 3. Filter subscriptions for users due for reminder this hour
    const eligibleSubs = subscriptions.filter((sub) => {
      if (sendAll) return true;

      const userSettings = settingsMap.get(sub.user_id);
      // If user explicitly disabled notifications, skip
      if (userSettings && userSettings.enabled === false) {
        return false;
      }

      const reminderTimes = (userSettings && Array.isArray(userSettings.reminder_times) && userSettings.reminder_times.length > 0)
        ? userSettings.reminder_times
        : ['07:00', '18:00'];

      // Determine user's local hour
      const tz = (userSettings && userSettings.timezone && userSettings.timezone !== 'auto')
        ? userSettings.timezone
        : 'Asia/Bangkok';

      let localHourStr = '07';
      try {
        localHourStr = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          hour: '2-digit',
          hour12: false,
        }).format(now).padStart(2, '0');
      } catch {
        // Fallback to UTC+7 Bangkok
        const thaiDate = new Date(now.getTime() + 7 * 60 * 60 * 1000);
        localHourStr = String(thaiDate.getUTCHours()).padStart(2, '0');
      }

      // Check if user has a reminder set for this hour
      return reminderTimes.some((t) => {
        const h = (t || '').split(':')[0].padStart(2, '0');
        return h === localHourStr;
      });
    });

    const payload = JSON.stringify({
      title: 'Vibe Check ✨',
      body: 'ได้เวลาเช็คอินอารมณ์แล้ว! แวะมาบันทึกความรู้สึกและเติมไฟกันเถอะ 🔥',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'vibe-check-hourly-reminder',
      url: '/checkin',
    });

    let sentCount = 0;
    const staleEndpoints = [];

    await Promise.all(
      eligibleSubs.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, payload);
          sentCount++;
        } catch (err) {
          console.warn(`Failed push to ${sub.endpoint}:`, err.statusCode || err.message);
          if (err.statusCode === 404 || err.statusCode === 410) {
            staleEndpoints.push(sub.endpoint);
          }
        }
      })
    );

    // Clean up stale subscriptions
    if (staleEndpoints.length > 0) {
      await supabaseAdmin
        .from('push_subscriptions')
        .delete()
        .in('endpoint', staleEndpoints);
    }

    return res.status(200).json({
      success: true,
      timestamp: now.toISOString(),
      totalSubscriptions: subscriptions.length,
      dueReminders: eligibleSubs.length,
      sent: sentCount,
      cleaned: staleEndpoints.length,
    });
  } catch (err) {
    console.error('Send reminder error:', err);
    return res.status(500).json({ error: err.message || 'Failed to send reminders' });
  }
}
