import { requireAuth } from "@/shared/auth-helpers";
import { jsonBadRequest, jsonNotFound, jsonOk } from "@/shared/http";
import { getUserRepository } from "@/adapters/repositories/repository-factory";
import { UpdateUserRequestSchema } from "@/contracts/user";
import { buildUpdateUser } from "@/application/use-cases/users/update-user";
import { buildDeleteUser } from "@/application/use-cases/users/delete-user";
import type { UserId } from "@/domain/users/user";

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  await requireAuth();
  const { id } = await params;

  const userRepository = getUserRepository();
  const user = await userRepository.getById(id as UserId);

  if (!user) {
    return jsonNotFound("User not found.");
  }

  return jsonOk({ data: user });
};

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  await requireAuth();
  const { id } = await params;

  const body = await request.json();
  const validation = UpdateUserRequestSchema.safeParse(body);

  if (!validation.success) {
    return jsonBadRequest({
      message: "Invalid request body.",
      details: validation.error.format(),
    });
  }

  const userRepository = getUserRepository();
  const updateUser = buildUpdateUser({ userRepository });

  const result = await updateUser(id, validation.data);

  if (!result.ok) {
    return jsonBadRequest({
      message: result.error.message,
      details: result.error,
    });
  }

  return jsonOk({ data: result.value });
};

export const DELETE = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  await requireAuth();
  const { id } = await params;

  const userRepository = getUserRepository();
  const deleteUser = buildDeleteUser({ userRepository });

  const result = await deleteUser(id);

  if (!result.ok) {
    return jsonNotFound(result.error.message);
  }

  return jsonOk({ message: "User deleted successfully." });
};
