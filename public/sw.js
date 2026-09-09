// Service Worker for Vibe Check
// Supports:
// 1. Web Push Notifications
// 2. Client-Side Scheduling (Free, device-local reminders via IndexedDB + Timers)

const DB_NAME = 'vibe_check_db';
const DB_VERSION = 1;
const STORE_NAME = 'settings';

let reminderTimeoutId = null;

// ============================================
// IndexedDB Helper
// ============================================
function openDB() {
  return new Promise((resolve, reject) => {
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

async function getStoredItem(key) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.error('[SW] Error reading item from IndexedDB:', err);
    return null;
  }
}

async function setStoredItem(key, value) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ key, value });
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (err) {
    console.error('[SW] Error saving item to IndexedDB:', err);
    return false;
  }
}

async function getStoredSettings() {
  return await getStoredItem('notification_settings');
}

async function setStoredSettings(settings) {
  return await setStoredItem('notification_settings', settings);
}

// ============================================
// Client-Side Scheduling Logic
// ============================================
async function scheduleNextReminder() {
  if (reminderTimeoutId) {
    clearTimeout(reminderTimeoutId);
    reminderTimeoutId = null;
  }

  const settings = await getStoredSettings();
  if (!settings || !settings.enabled) {
    return;
  }

  // If user prefers Discord DM notifications, do not pop up local browser notifications
  if (settings.discord_id) {
    return;
  }

  const reminderTimes = settings.reminder_times || ['07:00', '18:00'];
  if (!Array.isArray(reminderTimes) || reminderTimes.length === 0) {
    return;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const lastNotified = (await getStoredItem('last_notified')) || {};

  // 1. First check if any reminder was due in the last 30 minutes and hasn't been fired today
  for (const timeStr of reminderTimes) {
    const parts = timeStr.split(':');
    if (parts.length < 2) continue;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) continue;

    const targetToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
    const diffPast = now.getTime() - targetToday.getTime();
    if (diffPast >= 0 && diffPast <= 30 * 60 * 1000) {
      if (lastNotified[timeStr] !== todayStr) {
        lastNotified[timeStr] = todayStr;
        await setStoredItem('last_notified', lastNotified);
        await showReminderNotification(timeStr);
      }
    }
  }

  // 2. Find next upcoming target time
  let minDiff = Infinity;
  let nextTarget = null;
  let nextTimeStr = null;

  for (const timeStr of reminderTimes) {
    const parts = timeStr.split(':');
    if (parts.length < 2) continue;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) continue;

    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
    // If this time already passed today, schedule for tomorrow
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }

    const diff = target.getTime() - now.getTime();
    if (diff > 0 && diff < minDiff) {
      minDiff = diff;
      nextTarget = target;
      nextTimeStr = timeStr;
    }
  }

  if (nextTarget && minDiff < 86400000 * 2) {
    console.log(`[SW] Next reminder scheduled for ${nextTarget.toLocaleString()} (in ${Math.round(minDiff / 1000)}s)`);
    reminderTimeoutId = setTimeout(async () => {
      const curNow = new Date();
      const curYear = curNow.getFullYear();
      const curMonth = String(curNow.getMonth() + 1).padStart(2, '0');
      const curDay = String(curNow.getDate()).padStart(2, '0');
      const curTodayStr = `${curYear}-${curMonth}-${curDay}`;

      const updatedNotified = (await getStoredItem('last_notified')) || {};
      updatedNotified[nextTimeStr] = curTodayStr;
      await setStoredItem('last_notified', updatedNotified);
      await showReminderNotification(nextTimeStr);
      // Automatically schedule the next one
      scheduleNextReminder();
    }, minDiff);
  }
}

async function showReminderNotification(timeStr) {
  const settings = (await getStoredSettings()) || {};
  const isEn = settings.lang === 'en';

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
    data: {
      url: '/checkin',
    },
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
    await self.registration.showNotification(title, options);
  } catch (err) {
    console.error('[SW] Error showing notification:', err);
  }
}

// ============================================
// Lifecycle Events
// ============================================
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      scheduleNextReminder(),
    ])
  );
});

// Listen for messages from web application
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SCHEDULE_REMINDERS') {
    const settings = event.data.settings;
    event.waitUntil(
      (async () => {
        if (settings) {
          await setStoredSettings(settings);
        }
        await scheduleNextReminder();
      })()
    );
  } else if (event.data.type === 'CANCEL_REMINDERS') {
    if (reminderTimeoutId) {
      clearTimeout(reminderTimeoutId);
      reminderTimeoutId = null;
    }
  } else if (event.data.type === 'TEST_LOCAL_NOTIFICATION') {
    event.waitUntil(
      showReminderNotification('test')
    );
  }
});

// Periodic Background Sync (PWA / supported browsers)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'vibe-check-reminder' || event.tag === 'daily-reminder') {
    event.waitUntil(scheduleNextReminder());
  }
});

// ============================================
// Web Push Events (Server-Side Push Reminders)
// ============================================
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      title: 'Vibe Check ✨',
      body: event.data ? event.data.text() : 'ได้เวลาเช็คอินอารมณ์และเติมไฟกันเถอะ 🔥',
    };
  }

  const title = data.title || 'Vibe Check ✨';
  const options = {
    body: data.body || 'ได้เวลาเช็คอินอารมณ์และเติมไฟกันเถอะ 🔥',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'vibe-check-daily-reminder',
    renotify: true,
    timestamp: Date.now(),
    vibrate: [150, 75, 150],
    data: {
      url: data.url || '/checkin',
    },
    actions: [
      { action: 'checkin', title: 'เช็คอินเลย 📝' },
      { action: 'close', title: 'ไว้ทีหลัง' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/checkin';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url && 'focus' in client) {
          client.focus();
          return client.navigate(targetUrl);
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
