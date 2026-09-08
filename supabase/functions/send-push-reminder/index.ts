// Supabase Edge Function: send-push-reminder
// Deno TypeScript Function to send Web Push notifications based on user hourly settings

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import webpush from "npm:web-push@3.6.7";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "BOHA5PjSz12Y2G_C9rRtT9MtfmNOI5WIP34dBHqgJbwgqPPB7U8V8CIcR59t3LlDq6rW1_n8HEwHWHXfDOXVJ48";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "oYX-PrNUcyyu1XhGrxsFy1A1kzS1nkBeGhVNC7iLz_w";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:support@vibecheck.app";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const now = new Date();

    // 1. Fetch all push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (subError) throw subError;
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: "No push subscriptions found", sent: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Fetch all notification settings
    const { data: settingsList, error: settingsError } = await supabase
      .from("notification_settings")
      .select("*");

    if (settingsError) {
      console.warn("Could not fetch notification_settings:", settingsError);
    }

    const settingsMap = new Map();
    (settingsList || []).forEach((s: any) => {
      settingsMap.set(s.user_id, s);
    });

    // 3. Filter subscriptions for users whose reminder hour matches right now
    const eligibleSubs = subscriptions.filter((sub: any) => {
      const userSettings = settingsMap.get(sub.user_id);
      if (userSettings && userSettings.enabled === false) {
        return false;
      }

      const reminderTimes = (userSettings && Array.isArray(userSettings.reminder_times) && userSettings.reminder_times.length > 0)
        ? userSettings.reminder_times
        : ["07:00", "18:00"];

      const tz = (userSettings && userSettings.timezone && userSettings.timezone !== "auto")
        ? userSettings.timezone
        : "Asia/Bangkok";

      let localHourStr = "07";
      try {
        localHourStr = new Intl.DateTimeFormat("en-US", {
          timeZone: tz,
          hour: "2-digit",
          hour12: false,
        }).format(now).padStart(2, "0");
      } catch {
        const thaiDate = new Date(now.getTime() + 7 * 60 * 60 * 1000);
        localHourStr = String(thaiDate.getUTCHours()).padStart(2, "0");
      }

      return reminderTimes.some((t: string) => {
        const h = (t || "").split(":")[0].padStart(2, "0");
        return h === localHourStr;
      });
    });

    const payload = JSON.stringify({
      title: "Vibe Check ✨",
      body: "ได้เวลาเช็คอินอารมณ์แล้ว! แวะมาบันทึกความรู้สึกและเติมไฟกันเถอะ 🔥",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "vibe-check-hourly-reminder",
      url: "/checkin",
    });

    let sentCount = 0;
    const staleEndpoints: string[] = [];

    await Promise.all(
      eligibleSubs.map(async (sub: any) => {
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
        } catch (err: any) {
          console.warn(`Failed push to ${sub.endpoint}:`, err.statusCode || err.message);
          if (err.statusCode === 404 || err.statusCode === 410) {
            staleEndpoints.push(sub.endpoint);
          }
        }
      })
    );

    // Clean up stale subscriptions
    if (staleEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", staleEndpoints);
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: now.toISOString(),
        totalSubscriptions: subscriptions.length,
        dueReminders: eligibleSubs.length,
        sent: sentCount,
        cleaned: staleEndpoints.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Edge function push error:", err);
    return new Response(JSON.stringify({ error: err.message || "Failed to send reminders" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
