import {
  getUserRepository,
  getMagicLinkRepository,
} from "@/adapters/repositories/repository-factory";
import { createSession } from "@/domain/auth/auth";
import { createUser, UserId } from "@/domain/users/user";
import {
  jsonBadRequest,
  jsonOk,
  jsonUnauthorized,
  jsonServerError,
} from "@/shared/http";
import {
  createSessionToken,
  sessionCookieOptions,
  sessionDataCookieOptions,
} from "@/shared/session";
import { generateUserId } from "@/shared/secure-id";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const userRepo = getUserRepository();
const magicLinkRepo = getMagicLinkRepository();

// GET /api/auth/verify?token=xxx
export const GET = async (request: Request) => {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return jsonBadRequest("Token is required");
    }

    // Verify token
    const email = await magicLinkRepo.verify(token);

    if (!email) {
      return jsonUnauthorized("Invalid or expired token");
    }

    // Get or create user
    let user = await userRepo.getByEmail(email);
    if (!user) {
      // Create new user using domain function
      const userId = generateUserId() as UserId;
      const userResult = createUser(userId, {
        email,
        role: "user",
        status: "active",
      });

      if (!userResult.ok) {
        return jsonBadRequest(userResult.error.message);
      }

      await userRepo.create(userResult.value);
      user = userResult.value;
    }

    // Delete used token
    await magicLinkRepo.delete(token);

    // Create session
    const session = createSession(
      user.id,
      user.email,
      user.username,
      user.role
    );
    const sessionToken = await createSessionToken(session);

    // Set session cookies using Next.js 15+ API
    const cookieStore = await cookies();

    cookieStore.set("session", sessionToken, sessionCookieOptions);
    cookieStore.set(
      "session_data",
      JSON.stringify(session),
      sessionDataCookieOptions
    );

    return jsonOk({
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Verification error:", error);
    return jsonServerError("Failed to verify token");
  }
};
