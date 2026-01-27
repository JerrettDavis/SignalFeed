import { requireAuth } from "@/shared/auth-helpers";
import { buildUpdateSubscription } from "@/application/use-cases/update-subscription";
import { buildDeleteSubscription } from "@/application/use-cases/delete-subscription";
import { getSubscriptionRepository } from "@/adapters/repositories/repository-factory";
import { UpdateSubscriptionRequestSchema } from "@/contracts/subscription";
import { jsonOk, jsonBadRequest, jsonNotFound } from "@/shared/http";

export const runtime = "nodejs";

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  await requireAuth();

  const { id } = await params;
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonBadRequest({ message: "Invalid JSON payload." });
  }

  const parsed = UpdateSubscriptionRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonBadRequest({
      message: "Invalid payload.",
      details: parsed.error.flatten(),
    });
  }

  const updateSubscription = buildUpdateSubscription({
    repository: getSubscriptionRepository(),
  });

  const result = await updateSubscription(id, parsed.data);

  if (!result.ok) {
    if (result.error.code === "subscription.not_found") {
      return jsonNotFound(result.error.message);
    }
    return jsonBadRequest({ message: result.error.message });
  }

  return jsonOk({ data: result.value });
};

export const DELETE = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  await requireAuth();

  const { id } = await params;

  const deleteSubscription = buildDeleteSubscription({
    repository: getSubscriptionRepository(),
  });

  const result = await deleteSubscription(id);

  if (!result.ok) {
    if (result.error.code === "subscription.not_found") {
      return jsonNotFound(result.error.message);
    }
    return jsonBadRequest({ message: result.error.message });
  }

  return jsonOk({ success: true });
};
