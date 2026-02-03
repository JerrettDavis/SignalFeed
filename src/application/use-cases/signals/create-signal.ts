import {
  createSignal as createSignalEntity,
  type NewSignal,
  type Signal,
  type SignalId,
} from "@/domain/signals/signal";
import {
  validateGlobalSignalPermission,
  validateSightingTypeCount,
} from "@/domain/users/membership-tier";
import type { UserId } from "@/domain/users/user";
import type { Clock } from "@/ports/clock";
import type { IdGenerator } from "@/ports/id-generator";
import type { SignalRepository } from "@/ports/signal-repository";
import type { UserRepository } from "@/ports/user-repository";
import { err, type DomainError, type Result } from "@/shared/result";

export type CreateSignal = (
  input: NewSignal
) => Promise<Result<Signal, DomainError>>;

type Dependencies = {
  repository: SignalRepository;
  userRepository: UserRepository;
  idGenerator: IdGenerator;
  clock: Clock;
};

export const buildCreateSignal = ({
  repository,
  userRepository,
  idGenerator,
  clock,
}: Dependencies): CreateSignal => {
  return async (input) => {
    // 1. Fetch user to check membership tier
    const user = await userRepository.getById(input.ownerId as UserId);
    if (!user) {
      return err({
        code: "user.not_found",
        message: "User not found.",
      });
    }

    // 2. Validate global signal permission (only admins)
    if (input.target.kind === "global") {
      const globalPermission = validateGlobalSignalPermission(
        user.membershipTier
      );
      if (!globalPermission.ok) {
        return globalPermission;
      }
    }

    // 3. Validate sighting type count against tier limits
    const typeCount = input.conditions?.typeIds?.length ?? 0;
    if (typeCount > 0) {
      const typeCountValidation = validateSightingTypeCount(
        typeCount,
        user.membershipTier
      );
      if (!typeCountValidation.ok) {
        return typeCountValidation;
      }
    }

    // 4. Create signal entity (domain validation)
    const id = idGenerator.nextId() as SignalId;
    const createdAt = clock.now();
    const signalResult = createSignalEntity(input, { id, createdAt });

    if (!signalResult.ok) {
      return signalResult;
    }

    // 5. Save to repository
    await repository.create(signalResult.value);
    return signalResult;
  };
};
