import {
  getUserRepository,
  getCredentialsRepository,
} from "@/adapters/repositories/repository-factory";
import { verifyPassword, createSession } from "@/domain/auth/auth";
import {
  jsonBadRequest,
  jsonOk,
  jsonServerError,
  jsonUnauthorized,
} from "@/shared/http";
import {
  createSessionToken,
  sessionCookieOptions,
  sessionDataCookieOptions,
} from "@/shared/session";
import { z } from "zod";

export const runtime = "nodejs";

const userRepo = getUserRepository();
const credRepo = getCredentialsRepository();

const LoginSchema = z.object({
  email: z.string().min(1).email(),
  password: z.string().min(1),
});

// POST /api/auth/login
export const POST = async (request: Request) => {
  try {
    const body = await request.json();

    // Validate and sanitize request input up front. Authorization decisions
    // below operate on the parsed/validated values, not raw request input.
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return jsonBadRequest("Email and password are required");
    }
    const { email, password } = parsed.data;

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

    // Create session. The signed token in the httpOnly `session` cookie is the
    // authoritative source of identity; `session_data` is a non-trusted,
    // client-readable copy for UI hydration only.
    const session = createSession(
      user.id,
      user.email,
      user.username,
      user.role
    );
    const sessionToken = await createSessionToken(session);

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

    response.cookies.set("session", sessionToken, sessionCookieOptions);
    response.cookies.set(
      "session_data",
      JSON.stringify(session),
      sessionDataCookieOptions
    );

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return jsonServerError("Failed to login");
  }
};
