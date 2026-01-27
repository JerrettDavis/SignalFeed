import type { User, UserId, UpdateUser } from "@/domain/users/user";
import { updateUser as updateUserDomain } from "@/domain/users/user";
import type { UserRepository } from "@/ports/user-repository";
import { err, ok, type DomainError, type Result } from "@/shared/result";

export type UpdateUserUseCase = (
  id: string,
  updates: UpdateUser
) => Promise<Result<User, DomainError>>;

type Dependencies = {
  userRepository: UserRepository;
};

export const buildUpdateUser = ({
  userRepository,
}: Dependencies): UpdateUserUseCase => {
  return async (id, updates) => {
    // Get existing user
    const existing = await userRepository.getById(id as UserId);
    if (!existing) {
      return err({
        code: "user.not_found",
        message: "User not found.",
      });
    }

    // Apply updates with validation
    const result = updateUserDomain(existing, updates);
    if (!result.ok) {
      return result;
    }

    // Save updated user
    await userRepository.update(result.value);

    return ok(result.value);
  };
};
