import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { getUserSettingsRepository } from "@/adapters/repositories/repository-factory";
import { jsonOk, jsonBadRequest, jsonUnauthorized } from "@/shared/http";
import { getVerifiedSession } from "@/shared/session";
import { z } from "zod";

const UpdateSettingsSchema = z.object({
  notificationsEnabled: z.boolean().optional(),
  locationSharingEnabled: z.boolean().optional(),
  followMeMode: z.boolean().optional(),
  publicProfile: z.boolean().optional(),
  theme: z.enum(["light", "dark", "auto"]).optional(),
  mapStyle: z.enum(["standard", "satellite", "terrain"]).optional(),
});

// GET /api/users/settings - Get user settings
export async function GET() {
  const cookieStore = await cookies();
  const session = await getVerifiedSession(cookieStore);

  if (!session) {
    return jsonUnauthorized("Not authenticated");
  }

  const { userId } = session;
  const repository = getUserSettingsRepository();

  let settings = await repository.findByUserId(userId);

  // Create default settings if they don&apos;t exist
  if (!settings) {
    const { createDefaultSettings } =
      await import("@/domain/users/user-settings");
    settings = createDefaultSettings(userId);
    await repository.save(settings);
  }

  return jsonOk({ settings });
}

// PATCH /api/users/settings - Update user settings
export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies();
  const session = await getVerifiedSession(cookieStore);

  if (!session) {
    return jsonUnauthorized("Not authenticated");
  }

  const { userId } = session;

  try {
    const body = await request.json();
    const validatedData = UpdateSettingsSchema.parse(body);

    const repository = getUserSettingsRepository();
    const settings = await repository.update(userId, validatedData);

    return jsonOk({ settings });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonBadRequest({
        message: "Invalid request data",
        errors: error.issues,
      });
    }

    console.error("[Settings API] Error updating settings:", error);
    return jsonBadRequest({ message: "Failed to update settings" });
  }
}
