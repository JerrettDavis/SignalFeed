import { buildCreateSubscription } from "@/application/use-cases/create-subscription";
import { buildListSubscriptions } from "@/application/use-cases/list-subscriptions";
import { systemClock } from "@/adapters/clock/system-clock";
import { ulidGenerator } from "@/adapters/id/ulid-generator";
import { getSubscriptionRepository } from "@/adapters/repositories/repository-factory";
import { CreateSubscriptionRequestSchema } from "@/contracts/subscription";
import { jsonBadRequest, jsonCreated, jsonOk } from "@/shared/http";

export const runtime = "nodejs";

const repository = getSubscriptionRepository();
const createSubscription = buildCreateSubscription({
  repository,
  idGenerator: ulidGenerator,
  clock: systemClock,
});
const listSubscriptions = buildListSubscriptions(repository);

export const GET = async (request: Request) => {
  const email = new URL(request.url).searchParams.get("email") ?? undefined;
  const subscriptions = await listSubscriptions(email ? { email } : undefined);
  return jsonOk({ data: subscriptions });
};

export const POST = async (request: Request) => {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonBadRequest({ message: "Invalid JSON payload." });
  }

  const parsed = CreateSubscriptionRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonBadRequest({
      message: "Invalid payload.",
      details: parsed.error.flatten(),
    });
  }

  const result = await createSubscription(parsed.data);
  if (!result.ok) {
    return jsonBadRequest({
      message: result.error.message,
      details: result.error,
    });
  }

  return jsonCreated({ data: result.value });
};
