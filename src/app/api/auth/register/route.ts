import {
  getUserRepository,
  getCredentialsRepository,
} from "@/adapters/repositories/repository-factory";
import {
  hashPassword,
  validatePassword,
  createSession,
} from "@/domain/auth/auth";
import { validateEmail, createUser } from "@/domain/users/user";
import type { UserId } from "@/domain/users/user";
import { jsonBadRequest, jsonCreated, jsonServerError } from "@/shared/http";
import {
  createSessionToken,
  sessionCookieOptions,
  sessionDataCookieOptions,
} from "@/shared/session";
import { generateUserId } from "@/shared/secure-id";

export const runtime = "nodejs";

const userRepo = getUserRepository();
const credRepo = getCredentialsRepository();

// POST /api/auth/register
export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const { email, password, username } = body;

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.ok) {
      return jsonBadRequest(emailValidation.error.message);
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.ok) {
      return jsonBadRequest(passwordValidation.error.message);
    }

    // Check if user already exists
    const existing = await userRepo.getByEmail(email);
    if (existing) {
      return jsonBadRequest("Email already registered");
    }

    // Create user ID (cryptographically secure random suffix)
    const userId = generateUserId() as UserId;

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const userResult = createUser(userId, {
      email: emailValidation.value,
      username,
      role: "user",
      status: "active",
    });

    if (!userResult.ok) {
      return jsonBadRequest(userResult.error.message);
    }

    // Save user
    await userRepo.create(userResult.value);

    // Save credentials
    const now = new Date().toISOString();
    await credRepo.create({
      id: userId,
      email: emailValidation.value,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    // Create session
    const session = createSession(
      userId,
      userResult.value.email,
      userResult.value.username,
      userResult.value.role
    );
    const sessionToken = await createSessionToken(session);

    // Set session cookie
    const response = jsonCreated({
      data: {
        user: {
          id: userResult.value.id,
          email: userResult.value.email,
          username: userResult.value.username,
          role: userResult.value.role,
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
    console.error("Registration error:", error);
    return jsonServerError("Failed to register user");
  }
};
