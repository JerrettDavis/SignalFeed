import { requireAuth } from "@/shared/auth-helpers";
import { getSubscriptionRepository } from "@/adapters/repositories/repository-factory";
import { jsonBadRequest, jsonOk } from "@/shared/http";
import { z } from "zod";
import type { SubscriptionId } from "@/domain/subscriptions/subscription";

export const runtime = "nodejs";

const BulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1),
});

export const POST = async (request: Request) => {
  await requireAuth();

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonBadRequest({ message: "Invalid JSON payload." });
  }

  const parsed = BulkDeleteSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonBadRequest({
      message: "Invalid payload.",
      details: parsed.error.flatten(),
    });
  }

  const repository = getSubscriptionRepository();
  await repository.deleteMany(parsed.data.ids as SubscriptionId[]);

  return jsonOk({ success: true, deletedCount: parsed.data.ids.length });
};
