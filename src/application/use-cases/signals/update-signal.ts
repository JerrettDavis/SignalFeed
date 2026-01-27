import {
  updateSignal as updateSignalEntity,
  type Signal,
  type SignalId,
  type UpdateSignal as UpdateSignalInput,
} from "@/domain/signals/signal";
import type { Clock } from "@/ports/clock";
import type { SignalRepository } from "@/ports/signal-repository";
import { err, type DomainError, type Result } from "@/shared/result";

export type UpdateSignal = (
  id: string,
  updates: UpdateSignalInput,
  userId: string
) => Promise<Result<Signal, DomainError>>;

type Dependencies = {
  repository: SignalRepository;
  clock: Clock;
};

export const buildUpdateSignal = ({
  repository,
  clock,
}: Dependencies): UpdateSignal => {
  return async (id, updates, userId) => {
    const existing = await repository.getById(id as SignalId);

    if (!existing) {
      return err({
        code: "signal.not_found",
        message: "Signal not found.",
      });
    }

    // Validate ownership
    if (existing.ownerId !== userId) {
      return err({
        code: "signal.unauthorized",
        message: "You do not have permission to update this signal.",
      });
    }

    const updatedAt = clock.now();
    const updateResult = updateSignalEntity(existing, updates, { updatedAt });

    if (!updateResult.ok) {
      return updateResult;
    }

    await repository.update(updateResult.value);
    return updateResult;
  };
};
