import { NextRequest } from "next/server";
import { requireAuth } from "@/shared/auth-helpers";
import { getSignalRepository } from "@/adapters/repositories/repository-factory";
import { jsonBadRequest, jsonOk, jsonNotFound } from "@/shared/http";
import { SignalId, SignalClassification } from "@/domain/signals/signal";
import { SignalTargetSchema, SignalConditionsSchema } from "@/contracts/signal";
import { z } from "zod";

export const runtime = "nodejs";

/**
 * PATCH /api/admin/signals/[id]
 *
 * Updates signal properties (admin only).
 * Allows changing: name, description, classification, isActive status, target, conditions.
 */
export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  await requireAuth();

  const { id } = await params;
  const signalId = id as SignalId;

  // Parse request body
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonBadRequest({ message: "Invalid JSON payload." });
  }

  // Validate payload with Zod schema
  const UpdateSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    classification: z
      .enum(["official", "community", "personal", "verified"])
      .optional(),
    isActive: z.boolean().optional(),
    target: SignalTargetSchema.optional(),
    conditions: SignalConditionsSchema.optional(),
  });

  const parsed = UpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonBadRequest({
      message: "Invalid payload.",
      details: parsed.error.flatten(),
    });
  }

  const repository = getSignalRepository();

  // Check if signal exists
  const signal = await repository.getById(signalId);
  if (!signal) {
    return jsonNotFound("Signal not found.");
  }

  // Build updated signal by merging existing signal with changes
  const signalToUpdate = {
    ...signal,
    ...(parsed.data.name !== undefined && { name: parsed.data.name }),
    ...(parsed.data.description !== undefined && {
      description: parsed.data.description,
    }),
    ...(parsed.data.classification !== undefined && {
      classification: parsed.data.classification as SignalClassification,
    }),
    ...(parsed.data.isActive !== undefined && {
      isActive: parsed.data.isActive,
    }),
    ...(parsed.data.target !== undefined && { target: parsed.data.target }),
    ...(parsed.data.conditions !== undefined && {
      conditions: parsed.data.conditions,
    }),
    updatedAt: new Date().toISOString(),
  };

  // Update signal
  await repository.update(signalToUpdate);

  // Fetch updated signal
  const updatedSignal = await repository.getById(signalId);

  return jsonOk({ data: updatedSignal });
};

/**
 * DELETE /api/admin/signals/[id]
 *
 * Deletes a signal (admin only).
 * This is a permanent action.
 */
export const DELETE = async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  await requireAuth();

  const { id } = await params;
  const signalId = id as SignalId;

  const repository = getSignalRepository();

  // Check if signal exists
  const signal = await repository.getById(signalId);
  if (!signal) {
    return jsonNotFound("Signal not found.");
  }

  // Delete signal
  await repository.delete(signalId);

  return jsonOk({ message: "Signal deleted successfully." });
};
