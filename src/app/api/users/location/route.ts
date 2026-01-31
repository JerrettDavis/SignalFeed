import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { getLocationSharingRepository } from "@/adapters/repositories/repository-factory";
import {
  jsonOk,
  jsonBadRequest,
  jsonUnauthorized,
  jsonNoContent,
} from "@/shared/http";
import { z } from "zod";
import { canSeeLocation } from "@/domain/users/location-sharing";

const UpdateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  heading: z.number().optional(),
  speed: z.number().optional(),
  followMeMode: z.boolean(),
});

// GET /api/users/location - Get all active user locations (that viewer can see)
export async function GET() {
  const cookieStore = await cookies();
  const sessionData = cookieStore.get("session_data");

  if (!sessionData) {
    return jsonUnauthorized({ message: "Not authenticated" });
  }

  const { userId: viewerId } = JSON.parse(sessionData.value);
  const repository = getLocationSharingRepository();

  // Get all locations with Follow Me enabled
  const allLocations = await repository.getActiveLocations(true);

  // Filter locations based on permissions
  const visibleLocations = [];
  for (const location of allLocations) {
    const canSee = await canSeeLocation(
      viewerId,
      location.userId,
      location,
      repository
    );
    if (canSee) {
      visibleLocations.push(location);
    }
  }

  return jsonOk({ locations: visibleLocations });
}

// POST /api/users/location - Update current user&apos;s location
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionData = cookieStore.get("session_data");

  if (!sessionData) {
    return jsonUnauthorized({ message: "Not authenticated" });
  }

  const { userId } = JSON.parse(sessionData.value);

  try {
    const body = await request.json();
    const validatedData = UpdateLocationSchema.parse(body);

    const repository = getLocationSharingRepository();

    await repository.updateLocation({
      userId,
      ...validatedData,
      timestamp: new Date(),
    });

    return jsonOk({ message: "Location updated" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonBadRequest({
        message: "Invalid location data",
        errors: error.issues,
      });
    }

    console.error("[Location API] Error updating location:", error);
    return jsonBadRequest({ message: "Failed to update location" });
  }
}

// DELETE /api/users/location - Stop sharing location
export async function DELETE() {
  const cookieStore = await cookies();
  const sessionData = cookieStore.get("session_data");

  if (!sessionData) {
    return jsonUnauthorized({ message: "Not authenticated" });
  }

  const { userId } = JSON.parse(sessionData.value);
  const repository = getLocationSharingRepository();

  await repository.deleteLocation(userId);

  return jsonNoContent();
}
