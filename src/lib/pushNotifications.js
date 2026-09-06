import { supabase } from './supabase';

export const VAPID_PUBLIC_KEY = 'BOHA5PjSz12Y2G_C9rRtT9MtfmNOI5WIP34dBHqgJbwgqPPB7U8V8CIcR59t3LlDq6rW1_n8HEwHWHXfDOXVJ48';

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
 * Check if Web Push is supported in current environment
 */
export function isPushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
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
  if (!isPushSupported()) {
    throw new Error('อุปกรณ์หรือเบราว์เซอร์นี้ไม่รองรับ Web Push Notification');
  }

  // Request Notification permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('กรุณากดอนุญาต (Allow) การแจ้งเตือนในเบราว์เซอร์ของคุณ');
  }

  // Register service worker if not already
  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  // Get existing or create new push subscription
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const subJson = subscription.toJSON();
  const endpoint = subJson.endpoint;
  const p256dh = subJson.keys?.p256dh;
  const auth = subJson.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    throw new Error('ไม่สามารถสร้าง Push Token สำหรับอุปกรณ์นี้ได้');
  }

  // Save or update subscription in Supabase
  if (userId) {
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
  const sub = subscription || (await getCurrentPushSubscription());
  if (!sub) {
    throw new Error('ยังไม่มีการลงทะเบียนรับการแจ้งเตือน');
  }

  const res = await fetch('/api/notifications/test-push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: sub }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to send test notification');
  }

  return data;
}
