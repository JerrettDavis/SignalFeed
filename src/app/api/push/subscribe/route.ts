import { NextRequest } from "next/server";
import { z } from "zod";
import { getPushSubscriptionRepository } from "@/adapters/repositories/repository-factory";
import { jsonOk, jsonBadRequest, jsonUnauthorized } from "@/shared/http";
import { cookies } from "next/headers";

const SubscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication - get userId from session cookie
    const cookieStore = await cookies();
    const sessionData = cookieStore.get("session_data");
    const userId = sessionData?.value ? JSON.parse(sessionData.value).userId : null;
    
    if (!userId) {
      return jsonUnauthorized("Must be logged in to subscribe to push notifications");
    }

    // Parse request body
    const body = await request.json();
    const parsed = SubscribeSchema.safeParse(body);

    if (!parsed.success) {
      return jsonBadRequest(parsed.error.issues[0]?.message || "Invalid subscription data");
    }

    // Save subscription
    const repo = getPushSubscriptionRepository();
    const stored = await repo.save(userId, parsed.data.subscription);

    console.log(`[Push] User ${userId} subscribed to push notifications`);

    return jsonOk({ subscription: stored });
  } catch (error) {
    console.error("[Push] Subscribe error:", error);
    return jsonBadRequest("Failed to subscribe to push notifications");
  }
}
