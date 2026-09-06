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
    // Current date in Thailand timezone (UTC+7)
    const now = new Date();
    const thaiDate = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const todayStr = thaiDate.toISOString().split('T')[0];

    // 1. Fetch all push subscriptions
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*');

    if (subError) throw subError;
    if (!subscriptions || subscriptions.length === 0) {
      return res.status(200).json({ message: 'No push subscriptions found', sent: 0 });
    }

    // 2. Fetch checkins completed today
    const { data: todayCheckins, error: checkinError } = await supabaseAdmin
      .from('mood_checkins')
      .select('user_id')
      .eq('checkin_date', todayStr);

    if (checkinError) throw checkinError;

    const checkedInUserIds = new Set((todayCheckins || []).map((c) => c.user_id));

    // 3. Filter subscriptions for users who have NOT checked in today
    const pendingSubs = subscriptions.filter((s) => !checkedInUserIds.has(s.user_id));

    const currentHour = thaiDate.getUTCHours();
    const isMorning = currentHour < 13;

    const payload = JSON.stringify({
      title: isMorning ? 'เริ่มต้นวันใหม่ด้วยพลังบวก! ☀️' : 'อย่าลืมมาเติมไฟวันนี้นะ! 🔥',
      body: isMorning
        ? 'เช็คอินอารมณ์ 60 วินาทีในยามเช้า เพื่อเติมพลังรับวันใหม่กันเถอะ!'
        : 'เย็นแล้ว มาเช็คอินอารมณ์ 60 วินาที เพื่อรักษาสถิติไฟต่อเนื่องกันเถอะ!',
      url: '/checkin',
    });

    let sentCount = 0;
    const staleEndpoints = [];

    await Promise.all(
      pendingSubs.map(async (sub) => {
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
          // If subscription is expired or unsubscribed, mark for deletion
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
      today: todayStr,
      totalSubscriptions: subscriptions.length,
      pendingReminders: pendingSubs.length,
      sent: sentCount,
      cleaned: staleEndpoints.length,
    });
  } catch (err) {
    console.error('Send reminder error:', err);
    return res.status(500).json({ error: err.message || 'Failed to send reminders' });
  }
}
