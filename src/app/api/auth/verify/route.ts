import { getUserRepository, getMagicLinkRepository } from "@/adapters/repositories/repository-factory";
import { createSession, generateSessionToken } from "@/domain/auth/auth";
import { jsonBadRequest, jsonOk, jsonUnauthorized, jsonServerError } from "@/shared/http";

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

    // Get user
    const user = await userRepo.getByEmail(email);
    if (!user) {
      return jsonServerError("User not found");
    }

    // Delete used token
    await magicLinkRepo.delete(token);

    // Create session
    const session = createSession(user.id, user.email, user.username, user.role);
    const sessionToken = generateSessionToken();

    // Set session cookie
    const response = jsonOk({
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
      },
    });

    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    response.cookies.set("session_data", JSON.stringify(session), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Verification error:", error);
    return jsonServerError("Failed to verify token");
  }
};