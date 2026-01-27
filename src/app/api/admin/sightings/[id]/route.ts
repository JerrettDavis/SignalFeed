import { requireAuth } from "@/shared/auth-helpers";
import { buildUpdateSighting } from "@/application/use-cases/update-sighting";
import { buildDeleteSighting } from "@/application/use-cases/delete-sighting";
import { getSightingRepository } from "@/adapters/repositories/repository-factory";
import { UpdateSightingRequestSchema } from "@/contracts/sighting";
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

  const parsed = UpdateSightingRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonBadRequest({
      message: "Invalid payload.",
      details: parsed.error.flatten(),
    });
  }

  const updateSighting = buildUpdateSighting({
    repository: getSightingRepository(),
  });

  const result = await updateSighting(id, parsed.data);

  if (!result.ok) {
    if (result.error.code === "sighting.not_found") {
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

  const deleteSighting = buildDeleteSighting({
    repository: getSightingRepository(),
  });

  const result = await deleteSighting(id);

  if (!result.ok) {
    if (result.error.code === "sighting.not_found") {
      return jsonNotFound(result.error.message);
    }
    return jsonBadRequest({ message: result.error.message });
  }

  return jsonOk({ success: true });
};
