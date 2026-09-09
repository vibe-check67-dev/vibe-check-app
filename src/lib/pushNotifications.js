import { supabase } from './supabase';

export const VAPID_PUBLIC_KEY = 'BOHA5PjSz12Y2G_C9rRtT9MtfmNOI5WIP34dBHqgJbwgqPPB7U8V8CIcR59t3LlDq6rW1_n8HEwHWHXfDOXVJ48';

const DB_NAME = 'vibe_check_db';
const DB_VERSION = 1;
const STORE_NAME = 'settings';
const STORAGE_KEY = 'vibecheck_notification_settings';

// ============================================
// IndexedDB Client Helper
// ============================================
function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return resolve(null);
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbGetItem(key) {
  try {
    const db = await openDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn(`Error reading ${key} from IndexedDB:`, err);
    return null;
  }
}

export async function idbSetItem(key, value) {
  try {
    const db = await openDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ key, value });
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn(`Error saving ${key} to IndexedDB:`, err);
    return false;
  }
}

export async function idbGetNotificationSettings() {
  return await idbGetItem('notification_settings');
}

export async function idbSetNotificationSettings(settings) {
  return await idbSetItem('notification_settings', settings);
}

export async function idbGetLastNotified() {
  return await idbGetItem('last_notified');
}

export async function idbSetLastNotified(lastNotified) {
  return await idbSetItem('last_notified', lastNotified);
}

/**
 * Get user's local timezone
 */
export function getLocalTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Bangkok';
  } catch {
    return 'Asia/Bangkok';
  }
}

/**
 * Convert base64 string to Uint8Array for applicationServerKey
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if Web Notification and Service Worker are supported for client-side reminders
 */
export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Check if Web Push is supported in current environment
 */
export function isPushSupported() {
  return isNotificationSupported() && 'PushManager' in window;
}

/**
 * Get current active subscription if exists
 */
export async function getCurrentPushSubscription() {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    return sub;
  } catch (e) {
    console.error('Error getting current push subscription:', e);
    return null;
  }
}

/**
 * Subscribe user to Web Push and save to Supabase
 */
export async function subscribeToPush(userId) {
  if (!isNotificationSupported()) {
    throw new Error('อุปกรณ์หรือเบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน (Web Notification)');
  }

  // Request Notification permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('กรุณากดอนุญาต (Allow) การแจ้งเตือนในเบราว์เซอร์ของคุณ');
  }

  // Register service worker if not already
  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  // Attempt periodic background sync if supported
  try {
    if ('periodicSync' in registration) {
      await registration.periodicSync.register('vibe-check-reminder', {
        minInterval: 60 * 60 * 1000,
      });
    }
  } catch {
    // Optional feature in supporting browsers
  }

  // Get existing or create new push subscription if PushManager is available
  let subscription = null;
  if ('PushManager' in window) {
    try {
      subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }
    } catch (pushErr) {
      console.warn('Push manager subscribe fallback to client-side scheduling:', pushErr);
    }
  }

  if (subscription) {
    const subJson = subscription.toJSON();
    const endpoint = subJson.endpoint;
    const p256dh = subJson.keys?.p256dh;
    const auth = subJson.keys?.auth;

    // Save or update subscription in Supabase
    if (userId && endpoint && p256dh && auth) {
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert(
          {
            user_id: userId,
            endpoint,
            p256dh,
            auth,
          },
          { onConflict: 'endpoint' }
        );

      if (error) {
        console.warn('Could not save push subscription to Supabase:', error);
      }
    }
  }

  return subscription;
}

/**
 * Unsubscribe user from Web Push and remove from Supabase
 */
export async function unsubscribeFromPush(userId) {
  if (!isPushSupported()) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      if (userId) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .match({ user_id: userId, endpoint });
      }
    }
  } catch (e) {
    console.error('Error unsubscribing:', e);
  }
}

/**
 * Send an immediate test push notification
 */
export async function triggerTestPush(subscription) {
  // Ensure permission is granted or request it
  if (typeof Notification !== 'undefined') {
    if (Notification.permission === 'default') {
      const p = await Notification.requestPermission();
      if (p !== 'granted') {
        throw new Error('กรุณากดอนุญาต (Allow) การแจ้งเตือนในเบราว์เซอร์ของคุณ');
      }
    } else if (Notification.permission === 'denied') {
      throw new Error('การแจ้งเตือนถูกปิดกั้น กรุณาอนุญาตในการตั้งค่าเบราว์เซอร์');
    }
  }

  // 1. Try local test notification via active Service Worker
  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration) {
      if (registration.active) {
        registration.active.postMessage({ type: 'TEST_LOCAL_NOTIFICATION' });
        return { success: true, method: 'service_worker_local' };
      }
      if (registration.showNotification) {
        await registration.showNotification('Vibe Check ✨ (ทดสอบ)', {
          body: 'การแจ้งเตือนเตือนเติมไฟทำงานสมบูรณ์แล้ว! 🔥',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'vibe-check-test',
        });
        return { success: true, method: 'service_worker_local' };
      }
    }
  } catch (swErr) {
    console.warn('Local SW test trigger fallback:', swErr);
  }

  // 2. Direct Window Notification fallback
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification('Vibe Check ✨ (ทดสอบ)', {
      body: 'การแจ้งเตือนเตือนเติมไฟทำงานสมบูรณ์แล้ว! 🔥',
      icon: '/icon-192.png',
    });
    return { success: true, method: 'window_local' };
  }

  // 3. Fallback to server push if subscription available
  const sub = subscription || (await getCurrentPushSubscription());
  if (sub) {
    try {
      const res = await fetch('/api/notifications/test-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub }),
      });
      const data = await res.json();
      if (res.ok && data.success) return data;
    } catch {
      // server test optional
    }
  }

  return { success: true, method: 'fallback' };
}

// ============================================
// Notification Settings & Client Scheduling
// ============================================

const DEFAULT_SETTINGS = {
  enabled: false,
  reminder_times: ['07:00', '18:00'],
  timezone: 'auto',
  discord_id: '',
};

/**
 * Retrieve notification settings:
 * Checks Supabase -> IndexedDB -> localStorage -> Defaults
 */
export async function getNotificationSettings(userId) {
  let settings = null;

  // 1. Check IndexedDB
  try {
    settings = await idbGetNotificationSettings();
  } catch (err) {
    console.warn('idb read err:', err);
  }

  // 2. Check localStorage
  if (!settings) {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) settings = JSON.parse(cached);
    } catch {
      // ignore
    }
  }

  // 3. Fetch from Supabase if logged in
  if (userId) {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        settings = {
          enabled: !!data.enabled,
          reminder_times: Array.isArray(data.reminder_times) ? data.reminder_times : ['07:00', '18:00'],
          timezone: data.timezone || getLocalTimezone(),
          discord_id: data.discord_id || '',
        };
        // Update local caches
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        await idbSetNotificationSettings(settings);
      }
    } catch (err) {
      console.warn('Error fetching notification settings from Supabase:', err);
    }
  }

  if (!settings) {
    settings = {
      ...DEFAULT_SETTINGS,
      timezone: getLocalTimezone(),
    };
  }

  return settings;
}

/**
 * Save notification settings to Supabase, IndexedDB, localStorage, and notify SW
 */
export async function saveNotificationSettings(userId, settings) {
  const currentLang = settings.lang || (typeof localStorage !== 'undefined' ? localStorage.getItem('vibecheck_lang') : 'th') || 'th';
  const payload = {
    enabled: !!settings.enabled,
    reminder_times: settings.reminder_times && settings.reminder_times.length > 0
      ? settings.reminder_times
      : ['07:00', '18:00'],
    timezone: settings.timezone || getLocalTimezone(),
    discord_id: (settings.discord_id || '').trim(),
    lang: currentLang,
  };

  // 1. Save to localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }

  // 2. Save to IndexedDB
  await idbSetNotificationSettings(payload);

  // 3. Sync to Supabase
  if (userId) {
    try {
      const { error } = await supabase
        .from('notification_settings')
        .upsert(
          {
            user_id: userId,
            enabled: payload.enabled,
            reminder_times: payload.reminder_times,
            timezone: payload.timezone,
            discord_id: payload.discord_id || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.warn('Error syncing notification settings to Supabase:', error);
      }
    } catch (err) {
      console.warn('Supabase upsert failed:', err);
    }
  }

  // 4. Send message to Service Worker to reschedule
  notifyServiceWorker(payload);

  // 5. Update window thread scheduler
  if (payload.enabled) {
    startClientReminderScheduler(userId);
  } else {
    stopClientReminderScheduler();
  }

  return payload;
}

/**
 * Post message to Service Worker
 */
export function notifyServiceWorker(settings) {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  const msg = settings.enabled
    ? { type: 'SCHEDULE_REMINDERS', settings }
    : { type: 'CANCEL_REMINDERS' };

  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(msg);
  } else {
    navigator.serviceWorker.ready.then((reg) => {
      reg.active?.postMessage(msg);
    }).catch(() => {});
  }
}

// ============================================
// Active Client-Side Scheduling (Window Thread)
// ============================================

let clientSchedulerIntervalId = null;

export async function triggerLocalNotification(timeStr) {
  const isEn = typeof localStorage !== 'undefined' && localStorage.getItem('vibecheck_lang') === 'en';
  const title = 'Vibe Check ✨';
  const options = {
    body: isEn
      ? 'Time for your daily vibe check! Track your mood and keep your streak alive 🔥'
      : 'ได้เวลาเช็คอินอารมณ์แล้ว! แวะมาบันทึกความรู้สึกและเติมไฟกันเถอะ 🔥',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: `vibe-check-reminder-${timeStr || 'daily'}`,
    renotify: true,
    timestamp: Date.now(),
    vibrate: [100, 50, 100],
    data: { url: '/checkin' },
    actions: isEn
      ? [
          { action: 'checkin', title: 'Check In 📝' },
          { action: 'close', title: 'Later' },
        ]
      : [
          { action: 'checkin', title: 'เช็คอินเลย 📝' },
          { action: 'close', title: 'ไว้ทีหลัง' },
        ],
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        return await reg.showNotification(title, options);
      }
    }
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      return new Notification(title, options);
    }
  } catch (err) {
    console.warn('Error showing local notification:', err);
  }
}

export async function checkAndTriggerReminders(userId) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const settings = await getNotificationSettings(userId);
  if (!settings || !settings.enabled) return;

  // If user is receiving Discord notifications, suppress local browser notifications
  if (settings.discord_id) return;

  const times = settings.reminder_times || ['07:00', '18:00'];
  if (!Array.isArray(times) || times.length === 0) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  // Read and combine notified state from IndexedDB (shared with Service Worker) and localStorage
  let lastNotified = (await idbGetLastNotified()) || {};
  try {
    const raw = localStorage.getItem('vibecheck_last_notified');
    if (raw) {
      const local = JSON.parse(raw);
      lastNotified = { ...lastNotified, ...local };
    }
  } catch {
    // ignore
  }

  for (const timeStr of times) {
    const parts = timeStr.split(':');
    if (parts.length < 2) continue;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) continue;

    const scheduledDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
    const diff = now.getTime() - scheduledDate.getTime();

    // Check if within trigger window: between scheduled minute and 30 minutes after
    if (diff >= 0 && diff <= 30 * 60 * 1000) {
      if (lastNotified[timeStr] !== todayStr) {
        lastNotified[timeStr] = todayStr;
        try {
          localStorage.setItem('vibecheck_last_notified', JSON.stringify(lastNotified));
        } catch {
          // ignore
        }
        await idbSetLastNotified(lastNotified);
        await triggerLocalNotification(timeStr);
      }
    }
  }
}

export async function startClientReminderScheduler(userId) {
  if (typeof window === 'undefined') return;

  const settings = await getNotificationSettings(userId);
  if (settings?.discord_id) {
    stopClientReminderScheduler();
    return;
  }

  // Immediate check
  checkAndTriggerReminders(userId);

  if (clientSchedulerIntervalId) {
    clearInterval(clientSchedulerIntervalId);
  }

  // Check every 30 seconds while web app is open
  clientSchedulerIntervalId = setInterval(() => {
    checkAndTriggerReminders(userId);
  }, 30000);

  // Check on tab visibility change or focus
  const onFocusOrVisible = () => {
    if (document.visibilityState === 'visible') {
      checkAndTriggerReminders(userId);
    }
  };

  document.removeEventListener('visibilitychange', onFocusOrVisible);
  document.addEventListener('visibilitychange', onFocusOrVisible);
  window.removeEventListener('focus', onFocusOrVisible);
  window.addEventListener('focus', onFocusOrVisible);
}

export function stopClientReminderScheduler() {
  if (clientSchedulerIntervalId) {
    clearInterval(clientSchedulerIntervalId);
    clientSchedulerIntervalId = null;
  }
}
