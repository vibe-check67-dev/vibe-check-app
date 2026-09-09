import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// VAPID keys for Web Push fallback
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BOHA5PjSz12Y2G_C9rRtT9MtfmNOI5WIP34dBHqgJbwgqPPB7U8V8CIcR59t3LlDq6rW1_n8HEwHWHXfDOXVJ48';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'oYX-PrNUcyyu1XhGrxsFy1A1kzS1nkBeGhVNC7iLz_w';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@vibecheck.app';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (e) {
  console.warn('WebPush VAPID setup warning:', e?.message);
}

const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
const DISCORD_BOT_TOKEN = (process.env.DISCORD_BOT_TOKEN || '').trim();
const CRON_SECRET = (process.env.CRON_SECRET || '').trim();

// In-memory rate limiting for test DM requests (max 1 test per 5s per user)
const testRateLimitMap = new Map();

// Determine base URL for app links
function getAppBaseUrl(req) {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/+$/, '')}`;
  }
  const host = req?.headers?.host;
  if (host) {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    return `${proto}://${host.replace(/\/+$/, '')}`;
  }
  return 'https://vibe-check-app.vercel.app';
}

/**
 * Send a Discord DM via Discord REST API v10
 * 1. POST https://discord.com/api/v10/users/@me/channels  { recipient_id }
 * 2. POST https://discord.com/api/v10/channels/{channel_id}/messages
 */
async function sendDiscordDM(discordId, messagePayload) {
  // Input validation: Discord snowflakes are 17-20 digit strings
  if (!discordId || !/^\d{17,20}$/.test(String(discordId).trim())) {
    throw new Error(`รูปแบบ Discord ID ไม่ถูกต้อง ("${discordId}"): ต้องเป็นตัวเลขล้วน 17-20 หลัก`);
  }

  if (!DISCORD_BOT_TOKEN) {
    throw new Error('DISCORD_BOT_TOKEN ยังไม่ได้ตั้งค่าใน Environment Variables (Vercel Settings)');
  }

  const cleanDiscordId = String(discordId).trim();

  // Step 1: Create or get DM channel
  let dmChannelRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'VibeCheckBot (https://vibe-check-app.vercel.app, 1.0.0)',
    },
    body: JSON.stringify({ recipient_id: cleanDiscordId }),
  });

  // Handle Discord 429 rate limit if encountered
  if (dmChannelRes.status === 429) {
    const rateLimitData = await dmChannelRes.json().catch(() => ({}));
    const retryAfterSec = Number(rateLimitData.retry_after || 1);
    if (retryAfterSec <= 3) {
      await new Promise((r) => setTimeout(r, retryAfterSec * 1000 + 100));
      dmChannelRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'VibeCheckBot (https://vibe-check-app.vercel.app, 1.0.0)',
        },
        body: JSON.stringify({ recipient_id: cleanDiscordId }),
      });
    }
  }

  if (!dmChannelRes.ok) {
    const errBody = await dmChannelRes.json().catch(() => ({}));
    const code = errBody?.code;
    const msg = errBody?.message || dmChannelRes.statusText;

    if (code === 50007) {
      throw new Error(`บอทไม่สามารถส่ง DM ถึงผู้ใช้ ID ${cleanDiscordId} ได้ เนื่องจากผู้ใช้ปิดกั้นข้อความส่วนตัว หรือไม่ได้อยู่ใน Discord Server เดียวกันกับบอท (Error 50007: Cannot send messages to this user)`);
    } else if (code === 10013) {
      throw new Error(`ไม่พบบัญชีผู้ใช้ Discord ID ${cleanDiscordId} กรุณาตรวจสอบว่ากรอก User ID ถูกต้อง (Error 10013: Unknown User)`);
    } else if (dmChannelRes.status === 401) {
      throw new Error('บอท Discord ไม่ได้รับอนุญาต (Invalid DISCORD_BOT_TOKEN) โปรดตรวจสอบ Token ใน Vercel');
    } else {
      throw new Error(`เปิดช่อง DM Discord ไม่สำเร็จ [${dmChannelRes.status}]: ${msg} (code ${code || 'unknown'})`);
    }
  }

  const dmChannel = await dmChannelRes.json();
  const channelId = dmChannel.id;

  if (!channelId) {
    throw new Error('ไม่สามารถรับ Channel ID สำหรับส่งข้อความส่วนตัว Discord ได้');
  }

  // Step 2: Send Message to the DM channel
  let sendMsgRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'VibeCheckBot (https://vibe-check-app.vercel.app, 1.0.0)',
    },
    body: JSON.stringify(messagePayload),
  });

  if (sendMsgRes.status === 429) {
    const rateLimitData = await sendMsgRes.json().catch(() => ({}));
    const retryAfterSec = Number(rateLimitData.retry_after || 1);
    if (retryAfterSec <= 3) {
      await new Promise((r) => setTimeout(r, retryAfterSec * 1000 + 100));
      sendMsgRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'VibeCheckBot (https://vibe-check-app.vercel.app, 1.0.0)',
        },
        body: JSON.stringify(messagePayload),
      });
    }
  }

  if (!sendMsgRes.ok) {
    const errBody = await sendMsgRes.json().catch(() => ({}));
    throw new Error(`ส่งข้อความ Discord ไม่สำเร็จ [${sendMsgRes.status}]: ${errBody?.message || sendMsgRes.statusText}`);
  }

  return await sendMsgRes.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Cron-Secret');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Missing Supabase credentials' });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const appBaseUrl = getAppBaseUrl(req);
  const now = new Date();

  try {
    // Extract Authorization Bearer token
    const authHeader = req.headers?.authorization || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const querySecret = (req.query?.secret || req.query?.cron_secret || req.headers?.['x-cron-secret'] || '').trim();

    // =========================================================================
    // MODE 1: TEST MODE (Authenticated user testing Discord DM delivery)
    // e.g. GET/POST /api/notifications/send-reminder?test=1&discord_id=...
    // =========================================================================
    const isTest = req.query?.test === '1' || req.query?.test === 'true' || req.body?.test === true;

    if (isTest) {
      // Security: Test mode requires an authenticated Supabase user session
      if (!bearerToken) {
        return res.status(401).json({
          success: false,
          error: 'จำเป็นต้องเข้าสู่ระบบก่อนทดสอบส่งการแจ้งเตือน (Missing authorization token)',
        });
      }

      const { data: { user: authUser }, error: authErr } = await supabaseAdmin.auth.getUser(bearerToken);
      if (authErr || !authUser) {
        return res.status(401).json({
          success: false,
          error: 'เซสชันการเข้าสู่ระบบไม่ถูกต้องหรือหมดอายุ โปรดรีเฟรชหน้าเว็บแล้วเข้าสู่ระบบใหม่',
        });
      }

      // Rate limit check: max 1 test per 5s per user
      const lastTestTime = testRateLimitMap.get(authUser.id) || 0;
      const nowMs = Date.now();
      if (nowMs - lastTestTime < 5000) {
        const waitSec = Math.ceil((5000 - (nowMs - lastTestTime)) / 1000);
        return res.status(429).json({
          success: false,
          error: `กรุณารอสักครู่ (${waitSec} วินาที) ก่อนกดทดสอบส่งอีกครั้ง`,
        });
      }
      testRateLimitMap.set(authUser.id, nowMs);

      // Clean up old entries from rate limit map periodically
      if (testRateLimitMap.size > 500) {
        const threshold = nowMs - 60000;
        for (const [k, v] of testRateLimitMap.entries()) {
          if (v < threshold) testRateLimitMap.delete(k);
        }
      }

      // Determine target discord_id
      let targetDiscordId = (req.query?.discord_id || req.body?.discord_id || '').trim();

      if (!targetDiscordId) {
        // Fetch from user's notification settings
        const { data: userSettings } = await supabaseAdmin
          .from('notification_settings')
          .select('discord_id')
          .eq('user_id', authUser.id)
          .maybeSingle();

        targetDiscordId = (userSettings?.discord_id || '').trim();
      }

      if (!targetDiscordId) {
        return res.status(400).json({
          success: false,
          error: 'กรุณาระบุ Discord ID ในช่อง หรือบันทึก Discord ID ในหน้า Settings ก่อนทดสอบ',
        });
      }

      if (!/^\d{17,20}$/.test(targetDiscordId)) {
        return res.status(400).json({
          success: false,
          error: `รูปแบบ Discord ID ไม่ถูกต้อง ("${targetDiscordId}"): ต้องเป็นตัวเลขล้วน 17-20 หลัก`,
        });
      }

      const testPayload = {
        content: `👋 สวัสดีครับ <@${targetDiscordId}>! นี่คือข้อความทดสอบจากระบบ **Vibe Check Reminder Bot** ✨`,
        embeds: [
          {
            title: '🔥 การเชื่อมต่อ Discord สำเร็จสมบูรณ์!',
            description: 'ระบบตั้งเวลาแจ้งเตือนของคุณพร้อมทำงานแล้ว เมื่อถึงเวลาที่คุณตั้งไว้ บอทจะส่งข้อความมาเตือนคุณทาง DM นี้โดยตรง 🌿',
            color: 39086, // Brand sky blue #0098ee
            fields: [
              {
                name: '📝 ลิงก์เข้าสู่ระบบเช็คอิน',
                value: `[👉 กดที่นี่เพื่อเข้าสู่หน้าเช็คอิน](${appBaseUrl}/checkin)`,
                inline: false,
              },
            ],
            footer: {
              text: 'Vibe Check Bot • บันทึกสุขภาพใจ เติมไฟทุกวัน',
            },
            timestamp: new Date().toISOString(),
          },
        ],
      };

      try {
        const discordResult = await sendDiscordDM(targetDiscordId, testPayload);
        return res.status(200).json({
          success: true,
          message: 'ส่งข้อความทดสอบไปยัง Discord ของคุณสำเร็จแล้ว!',
          discordMessageId: discordResult?.id,
          targetDiscordId,
        });
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: err.message,
          hint: 'หากไม่ได้รับข้อความ: โปรดตรวจสอบว่าบอทอยู่ในเซิร์ฟเวอร์เดียวกับคุณ และเปิดรับข้อความส่วนตัว (Allow Direct Messages) ในเซิร์ฟเวอร์นั้น',
        });
      }
    }

    // =========================================================================
    // MODE 2: SCHEDULED HOURLY CRON / BATCH DISPATCH
    // =========================================================================

    // Security: If CRON_SECRET is configured, protect non-test executions
    const hasValidCronSecret = CRON_SECRET && (bearerToken === CRON_SECRET || querySecret === CRON_SECRET);
    if (CRON_SECRET && !hasValidCronSecret) {
      // Check if user is an admin manually triggering the reminder
      let isAdminUser = false;
      if (bearerToken) {
        const { data: { user: callerUser } } = await supabaseAdmin.auth.getUser(bearerToken);
        if (callerUser?.id) {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', callerUser.id)
            .maybeSingle();
          isAdminUser = profile?.role === 'admin';
        }
      }

      if (!isAdminUser) {
        return res.status(401).json({
          error: 'Unauthorized: CRON_SECRET หรือสิทธิ์ Admin จำเป็นสำหรับการสั่งรัน Cron Job',
        });
      }
    }

    // Protection on `all=1`: only allow if CRON_SECRET is valid or caller is verified admin
    const rawSendAll = req.query?.all === '1' || req.query?.all === 'true';
    let sendAll = false;
    if (rawSendAll) {
      if (hasValidCronSecret) {
        sendAll = true;
      } else if (bearerToken) {
        const { data: { user: callerUser } } = await supabaseAdmin.auth.getUser(bearerToken);
        if (callerUser?.id) {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', callerUser.id)
            .maybeSingle();
          sendAll = profile?.role === 'admin';
        }
      }
    }

    // 1. Fetch all notification settings
    const { data: settingsList, error: settingsError } = await supabaseAdmin
      .from('notification_settings')
      .select('*');

    if (settingsError) throw settingsError;

    // 2. Identify users due for reminder this hour
    const dueUsers = (settingsList || []).filter((userSettings) => {
      if (userSettings.enabled === false) return false;
      if (sendAll) return true;

      const reminderTimes = (Array.isArray(userSettings.reminder_times) && userSettings.reminder_times.length > 0)
        ? userSettings.reminder_times
        : ['07:00', '18:00'];

      const tz = (userSettings.timezone && userSettings.timezone !== 'auto')
        ? userSettings.timezone
        : 'Asia/Bangkok';

      let localHourStr = '07';
      try {
        localHourStr = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          hour: '2-digit',
          hourCycle: 'h23',
        }).format(now).padStart(2, '0');
      } catch {
        const thaiDate = new Date(now.getTime() + 7 * 60 * 60 * 1000);
        localHourStr = String(thaiDate.getUTCHours()).padStart(2, '0');
      }

      return reminderTimes.some((t) => {
        const h = (t || '').split(':')[0].padStart(2, '0');
        return h === localHourStr;
      });
    });

    // 3. Dispatch Discord DMs
    let discordSent = 0;
    const discordErrors = [];

    // Filter users with configured discord_id
    const discordEligible = dueUsers.filter(
      (u) => u.discord_id && /^\d{17,20}$/.test(String(u.discord_id).trim())
    );

    for (const userSettings of discordEligible) {
      const cleanId = String(userSettings.discord_id).trim();

      const tz = (userSettings.timezone && userSettings.timezone !== 'auto')
        ? userSettings.timezone
        : 'Asia/Bangkok';
      let hourDisplay = '';
      try {
        hourDisplay = `${new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', hourCycle: 'h23' }).format(now)}:00 น.`;
      } catch {
        hourDisplay = '';
      }

      const discordPayload = {
        content: `🔔 <@${cleanId}> ได้เวลาเช็คอินอารมณ์แล้ว! ✨ แวะมาบันทึกความรู้สึกและเติมไฟกันเถอะ 🔥`,
        embeds: [
          {
            title: '🌟 Vibe Check Daily Reminder',
            description: 'อย่าลืมแวะมาบันทึกอารมณ์และสำรวจสุขภาพใจประจำวันของคุณ เพื่อความสมดุลและพลังงานที่ดี 🌿',
            color: 39086,
            fields: [
              {
                name: '⏰ รอบเวลาแจ้งเตือน',
                value: hourDisplay || 'ตามรอบเวลาของคุณ',
                inline: true,
              },
              {
                name: '📝 ลิงก์เช็คอิน',
                value: `[👉 เช็คอินทันทีที่นี่](${appBaseUrl}/checkin)`,
                inline: true,
              },
            ],
            footer: {
              text: 'Vibe Check Bot • บันทึกสุขภาพใจ เติมไฟทุกวัน',
            },
            timestamp: now.toISOString(),
          },
        ],
      };

      try {
        await sendDiscordDM(cleanId, discordPayload);
        discordSent++;
        // Polite delay between requests to be gentle on Discord rate limits
        await new Promise((r) => setTimeout(r, 250));
      } catch (err) {
        console.warn(`Discord reminder failed for ${cleanId}:`, err.message);
        discordErrors.push({ discordId: cleanId, error: err.message });
      }
    }

    // 4. Fallback: Send Web Push notifications for eligible users who have push subscriptions
    let pushSent = 0;
    const staleEndpoints = [];

    const { data: subscriptions } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*');

    if (subscriptions && subscriptions.length > 0) {
      const dueUserIds = new Set(dueUsers.map((u) => u.user_id));
      const eligibleSubs = subscriptions.filter((sub) => sendAll || dueUserIds.has(sub.user_id));

      const webPushPayload = JSON.stringify({
        title: 'Vibe Check ✨',
        body: 'ได้เวลาเช็คอินอารมณ์แล้ว! แวะมาบันทึกความรู้สึกและเติมไฟกันเถอะ 🔥',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'vibe-check-hourly-reminder',
        url: '/checkin',
      });

      await Promise.all(
        eligibleSubs.map(async (sub) => {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          };
          try {
            await webpush.sendNotification(pushSubscription, webPushPayload);
            pushSent++;
          } catch (err) {
            if (err.statusCode === 404 || err.statusCode === 410) {
              staleEndpoints.push(sub.endpoint);
            }
          }
        })
      );

      if (staleEndpoints.length > 0) {
        await supabaseAdmin
          .from('push_subscriptions')
          .delete()
          .in('endpoint', staleEndpoints);
      }
    }

    return res.status(200).json({
      success: true,
      timestamp: now.toISOString(),
      dueUsersCount: dueUsers.length,
      discord: {
        eligible: discordEligible.length,
        sent: discordSent,
        errors: discordErrors,
      },
      webPush: {
        sent: pushSent,
        cleaned: staleEndpoints.length,
      },
    });
  } catch (err) {
    console.error('Send reminder general error:', err);
    return res.status(500).json({ error: err.message || 'Failed to send reminders' });
  }
}
