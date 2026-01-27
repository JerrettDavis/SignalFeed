import { requireAuth } from "@/shared/auth-helpers";
import { buildListSubscriptions } from "@/application/use-cases/list-subscriptions";
import { getSubscriptionRepository } from "@/adapters/repositories/repository-factory";
import { jsonOk } from "@/shared/http";
import type { SubscriptionFilters } from "@/ports/subscription-repository";

export const runtime = "nodejs";

const parseFilters = (searchParams: URLSearchParams): SubscriptionFilters => {
  const email = searchParams.get("email");

  return {
    email: email ?? undefined,
  };
};

export const GET = async (request: Request) => {
  await requireAuth();

  const filters = parseFilters(new URL(request.url).searchParams);

  const repository = getSubscriptionRepository();
  const listSubscriptions = buildListSubscriptions(repository);
  const subscriptions = await listSubscriptions(filters);

  return jsonOk({ data: subscriptions });
};
