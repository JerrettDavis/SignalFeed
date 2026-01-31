import { getUserRepository, getCredentialsRepository } from "@/adapters/repositories/repository-factory";
import { verifyPassword, createSession, generateSessionToken } from "@/domain/auth/auth";
import { jsonBadRequest, jsonOk, jsonServerError, jsonUnauthorized } from "@/shared/http";

export const runtime = "nodejs";

const userRepo = getUserRepository();
const credRepo = getCredentialsRepository();

// POST /api/auth/login
export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return jsonBadRequest("Email and password are required");
    }

    // Get credentials
    const creds = await credRepo.getByEmail(email);
    if (!creds) {
      return jsonUnauthorized("Invalid email or password");
    }

    // Verify password
    const isValid = await verifyPassword(password, creds.passwordHash);
    if (!isValid) {
      return jsonUnauthorized("Invalid email or password");
    }

    // Get user details
    const user = await userRepo.getById(creds.id);
    if (!user) {
      return jsonServerError("User not found");
    }

    // Check user status
    if (user.status !== "active") {
      return jsonUnauthorized("Account is not active");
    }

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
      maxAge: 60 * 60 * 24 * 7, // 7 days
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
    console.error("Login error:", error);
    return jsonServerError("Failed to login");
  }
};
