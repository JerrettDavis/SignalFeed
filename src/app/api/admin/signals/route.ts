import { requireAuth } from "@/shared/auth-helpers";
import { getSignalRepository } from "@/adapters/repositories/repository-factory";
import { jsonOk } from "@/shared/http";

export const runtime = "nodejs";

/**
 * GET /api/admin/signals
 *
 * Lists all signals with full details for admin moderation.
 * Requires admin authentication.
 */
export const GET = async () => {
  await requireAuth();

  const repository = getSignalRepository();
  const signals = await repository.list();

  return jsonOk({ data: signals });
};
