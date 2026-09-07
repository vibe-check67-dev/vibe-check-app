import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BOHA5PjSz12Y2G_C9rRtT9MtfmNOI5WIP34dBHqgJbwgqPPB7U8V8CIcR59t3LlDq6rW1_n8HEwHWHXfDOXVJ48';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'oYX-PrNUcyyu1XhGrxsFy1A1kzS1nkBeGhVNC7iLz_w';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@vibecheck.app';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subscription, title, body } = req.body || {};

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Missing push subscription object' });
    }

    const payload = JSON.stringify({
      title: title || 'Vibe Check พร้อมส่งพลังบวกให้คุณ ✨',
      body: body || 'ระบบแจ้งเตือนพร้อมใช้งานแล้ว แวะมาเช็คอินและเติมไฟได้ทุกวันครับ',
      tag: 'vibe-check-test',
      url: '/checkin',
    });

    await webpush.sendNotification(subscription, payload);

    return res.status(200).json({ success: true, message: 'Push notification sent successfully' });
  } catch (err) {
    console.error('Push notification error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to send push notification',
    });
  }
}
