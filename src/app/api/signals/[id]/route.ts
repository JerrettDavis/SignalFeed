import { buildUpdateSignal } from "@/application/use-cases/signals/update-signal";
import { buildDeleteSignal } from "@/application/use-cases/signals/delete-signal";
import { getSignalRepository } from "@/adapters/repositories/repository-factory";
import { systemClock } from "@/adapters/clock/system-clock";
import { UpdateSignalRequestSchema } from "@/contracts/signal";
import {
  jsonBadRequest,
  jsonNotFound,
  jsonOk,
  jsonUnauthorized,
  jsonForbidden,
} from "@/shared/http";
import type { SignalId } from "@/domain/signals/signal";
import type { SignalSubscriptionRepository } from "@/ports/signal-subscription-repository";

export const runtime = "nodejs";

const signalRepository = getSignalRepository();

// TODO: Import actual subscription repository when available
// For now, create a stub
const subscriptionRepository = {
  async list() {
    return [];
  },
  async delete() {},
};

const updateSignal = buildUpdateSignal({
  repository: signalRepository,
  clock: systemClock,
});

const deleteSignal = buildDeleteSignal({
  signalRepository,
  subscriptionRepository: subscriptionRepository as unknown as SignalSubscriptionRepository,
});

// Placeholder for auth - will be implemented later
const getUserIdFromSession = (): string | null => {
  // TODO: Implement proper auth
  return "placeholder-user-id";
};

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

export const GET = async (_request: Request, context: RouteContext) => {
  const params = await context.params;
  const signal = await signalRepository.getById(params.id as SignalId);

  if (!signal) {
    return jsonNotFound("Signal not found.");
  }

  return jsonOk({ data: signal });
};

export const PATCH = async (request: Request, context: RouteContext) => {
  const userId = getUserIdFromSession();
  if (!userId) {
    return jsonUnauthorized("Authentication required");
  }

  const params = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonBadRequest({ message: "Invalid JSON payload." });
  }

  const parsed = UpdateSignalRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonBadRequest({
      message: "Invalid payload.",
      details: parsed.error.flatten(),
    });
  }

  const result = await updateSignal(params.id, parsed.data, userId);

  if (!result.ok) {
    if (result.error.code === "signal.not_found") {
      return jsonNotFound(result.error.message);
    }
    if (result.error.code === "signal.unauthorized") {
      return jsonForbidden(result.error.message);
    }
    return jsonBadRequest({
      message: result.error.message,
      details: result.error,
    });
  }

  return jsonOk({ data: result.value });
};

export const DELETE = async (_request: Request, context: RouteContext) => {
  const userId = getUserIdFromSession();
  if (!userId) {
    return jsonUnauthorized("Authentication required");
  }

  const params = await context.params;
  const result = await deleteSignal(params.id, userId);

  if (!result.ok) {
    if (result.error.code === "signal.not_found") {
      return jsonNotFound(result.error.message);
    }
    if (result.error.code === "signal.unauthorized") {
      return jsonForbidden(result.error.message);
    }
    return jsonBadRequest({
      message: result.error.message,
      details: result.error,
    });
  }

  return jsonOk({ data: { success: true } });
};
