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

const BlockUserSchema = z.object({
  blockedUserId: z.string(),
});

// GET /api/users/location/block - Get list of blocked users
export async function GET() {
  const cookieStore = await cookies();
  const sessionData = cookieStore.get("session_data");

  if (!sessionData) {
    return jsonUnauthorized("Not authenticated");
  }

  const { userId } = JSON.parse(sessionData.value);
  const repository = getLocationSharingRepository();

  const blockedUsers = await repository.getBlockedUsers(userId);

  return jsonOk({ blockedUsers });
}

// POST /api/users/location/block - Block a user from seeing your location
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionData = cookieStore.get("session_data");

  if (!sessionData) {
    return jsonUnauthorized("Not authenticated");
  }

  const { userId } = JSON.parse(sessionData.value);

  try {
    const body = await request.json();
    const { blockedUserId } = BlockUserSchema.parse(body);

    if (userId === blockedUserId) {
      return jsonBadRequest({ message: "Cannot block yourself" });
    }

    const repository = getLocationSharingRepository();
    await repository.blockUser(userId, blockedUserId);

    return jsonOk({ message: "User blocked" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonBadRequest({
        message: "Invalid request data",
        errors: error.issues,
      });
    }

    console.error("[Block API] Error blocking user:", error);
    return jsonBadRequest({ message: "Failed to block user" });
  }
}

// DELETE /api/users/location/block - Unblock a user
export async function DELETE(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionData = cookieStore.get("session_data");

  if (!sessionData) {
    return jsonUnauthorized("Not authenticated");
  }

  const { userId } = JSON.parse(sessionData.value);

  try {
    const { searchParams } = new URL(request.url);
    const blockedUserId = searchParams.get("userId");

    if (!blockedUserId) {
      return jsonBadRequest({ message: "Missing userId parameter" });
    }

    const repository = getLocationSharingRepository();
    await repository.unblockUser(userId, blockedUserId);

    return jsonNoContent();
  } catch (error) {
    console.error("[Block API] Error unblocking user:", error);
    return jsonBadRequest({ message: "Failed to unblock user" });
  }
}
