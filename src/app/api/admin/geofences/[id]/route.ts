import { requireAuth } from "@/shared/auth-helpers";
import { buildUpdateGeofence } from "@/application/use-cases/update-geofence";
import { buildDeleteGeofence } from "@/application/use-cases/delete-geofence";
import { getGeofenceRepository } from "@/adapters/repositories/repository-factory";
import { UpdateGeofenceRequestSchema } from "@/contracts/geofence";
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

  const parsed = UpdateGeofenceRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonBadRequest({
      message: "Invalid payload.",
      details: parsed.error.flatten(),
    });
  }

  const updateGeofence = buildUpdateGeofence({
    repository: getGeofenceRepository(),
  });

  const result = await updateGeofence(id, parsed.data);

  if (!result.ok) {
    if (result.error.code === "geofence.not_found") {
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

  const deleteGeofence = buildDeleteGeofence({
    repository: getGeofenceRepository(),
  });

  const result = await deleteGeofence(id);

  if (!result.ok) {
    if (result.error.code === "geofence.not_found") {
      return jsonNotFound(result.error.message);
    }
    return jsonBadRequest({ message: result.error.message });
  }

  return jsonOk({ success: true });
};
