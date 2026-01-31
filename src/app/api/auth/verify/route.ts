import {
  getUserRepository,
  getMagicLinkRepository,
} from "@/adapters/repositories/repository-factory";
import { createSession, generateSessionToken } from "@/domain/auth/auth";
import {
  jsonBadRequest,
  jsonOk,
  jsonUnauthorized,
  jsonServerError,
} from "@/shared/http";
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
      // Create new user
      user = await userRepo.create({
        email,
        username: email.split("@")[0], // Use email prefix as default username
        role: "user",
        status: "active",
      });
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
    const sessionToken = generateSessionToken();

    // Set session cookies using Next.js 15+ API
    const cookieStore = await cookies();

    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    cookieStore.set("session_data", JSON.stringify(session), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

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
