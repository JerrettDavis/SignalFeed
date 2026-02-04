import { NextRequest } from "next/server";
import { requireAuth } from "@/shared/auth-helpers";
import { getSignalRepository } from "@/adapters/repositories/repository-factory";
import { jsonBadRequest, jsonOk } from "@/shared/http";
import { SignalId } from "@/domain/signals/signal";
import { z } from "zod";

export const runtime = "nodejs";

/**
 * POST /api/admin/signals/bulk-delete
 *
 * Bulk deletes multiple signals (admin only).
 * This is a permanent action.
 */
export const POST = async (request: NextRequest) => {
  await requireAuth();

  // Parse request body
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonBadRequest({ message: "Invalid JSON payload." });
  }

  // Validate payload
  const BulkDeleteSchema = z.object({
    ids: z.array(z.string()).min(1).max(100), // Max 100 at a time
  });

  const parsed = BulkDeleteSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonBadRequest({
      message: "Invalid payload. Expected { ids: string[] }.",
      details: parsed.error.flatten(),
    });
  }

  const repository = getSignalRepository();

  // Delete all signals
  const signalIds = parsed.data.ids.map((id) => id as SignalId);

  let deletedCount = 0;
  for (const signalId of signalIds) {
    try {
      const signal = await repository.getById(signalId);
      if (signal) {
        await repository.delete(signalId);
        deletedCount++;
      }
    } catch (error) {
      console.error(`Failed to delete signal ${signalId}:`, error);
      // Continue with other deletes
    }
  }

  return jsonOk({
    message: `Successfully deleted ${deletedCount} of ${signalIds.length} signals.`,
    deletedCount,
    totalRequested: signalIds.length,
  });
};
