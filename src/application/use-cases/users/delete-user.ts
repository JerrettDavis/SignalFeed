import type { UserId } from "@/domain/users/user";
import type { UserRepository } from "@/ports/user-repository";
import { err, ok, type DomainError, type Result } from "@/shared/result";

export type DeleteUserUseCase = (
  id: string
) => Promise<Result<void, DomainError>>;

type Dependencies = {
  userRepository: UserRepository;
};

export const buildDeleteUser = ({
  userRepository,
}: Dependencies): DeleteUserUseCase => {
  return async (id) => {
    // Check if user exists
    const existing = await userRepository.getById(id as UserId);
    if (!existing) {
      return err({
        code: "user.not_found",
        message: "User not found.",
      });
    }

    // Delete user
    await userRepository.delete(id as UserId);

    return ok(undefined);
  };
};
