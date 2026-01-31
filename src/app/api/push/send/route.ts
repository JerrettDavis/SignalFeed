import { NextRequest } from "next/server";
import { z } from "zod";
import webpush from "web-push";
import { getPushSubscriptionRepository } from "@/adapters/repositories/repository-factory";
import { jsonOk, jsonBadRequest, jsonServerError } from "@/shared/http";

const SendPushSchema = z.object({
  title: z.string(),
  body: z.string(),
  icon: z.string().optional(),
  url: z.string().optional(),
  tag: z.string().optional(),
  userIds: z.array(z.string()).optional(), // If specified, only send to these users
});

// Lazy initialization of VAPID details
let vapidConfigured = false;
function ensureVapidConfigured() {
  if (vapidConfigured) return;

  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@sightsignal.com";

  if (!privateKey || !publicKey) {
    throw new Error("VAPID keys not configured");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

export async function POST(request: NextRequest) {
  try {
    // Configure VAPID details on first request (not at module load)
    ensureVapidConfigured();
    // Parse request body
    const body = await request.json();
    const parsed = SendPushSchema.safeParse(body);

    if (!parsed.success) {
      return jsonBadRequest(
        parsed.error.issues[0]?.message || "Invalid push notification data"
      );
    }

    const { title, body: messageBody, icon, url, tag, userIds } = parsed.data;

    // Get subscriptions
    const repo = getPushSubscriptionRepository();
    let subscriptions = await repo.getAll();

    // Filter by userIds if specified
    if (userIds && userIds.length > 0) {
      subscriptions = subscriptions.filter((sub) =>
        userIds.includes(sub.userId)
      );
    }

    if (subscriptions.length === 0) {
      return jsonOk({ sent: 0, message: "No subscribers found" });
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title,
      body: messageBody,
      icon: icon || "/icon-192.png",
      badge: "/icon-192.png",
      tag: tag || "sightsignal-notification",
      data: {
        url: url || "/",
      },
    });

    // Send to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(sub.subscription, payload);
          return { success: true, userId: sub.userId };
        } catch (error: unknown) {
          console.error(`[Push] Failed to send to ${sub.userId}:`, error);
          // If subscription is invalid/expired, delete it
          if (error && typeof error === "object" && "statusCode" in error) {
            const statusCode = (error as { statusCode?: number }).statusCode;
            if (statusCode === 410 || statusCode === 404) {
              await repo.delete(sub.id);
              console.log(
                `[Push] Deleted expired subscription for user ${sub.userId}`
              );
            }
          }
          return { success: false, userId: sub.userId };
        }
      })
    );

    const sent = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;
    const failed = results.length - sent;

    console.log(`[Push] Sent ${sent} notifications, ${failed} failed`);

    return jsonOk({
      sent,
      failed,
      total: subscriptions.length,
    });
  } catch (error) {
    console.error("[Push] Send error:", error);
    return jsonServerError("Failed to send push notifications");
  }
}
