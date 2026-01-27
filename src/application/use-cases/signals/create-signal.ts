import {
  createSignal as createSignalEntity,
  type NewSignal,
  type Signal,
  type SignalId,
} from "@/domain/signals/signal";
import type { Clock } from "@/ports/clock";
import type { IdGenerator } from "@/ports/id-generator";
import type { SignalRepository } from "@/ports/signal-repository";
import type { DomainError, Result } from "@/shared/result";

export type CreateSignal = (
  input: NewSignal
) => Promise<Result<Signal, DomainError>>;

type Dependencies = {
  repository: SignalRepository;
  idGenerator: IdGenerator;
  clock: Clock;
};

export const buildCreateSignal = ({
  repository,
  idGenerator,
  clock,
}: Dependencies): CreateSignal => {
  return async (input) => {
    const id = idGenerator.nextId() as SignalId;
    const createdAt = clock.now();
    const signalResult = createSignalEntity(input, { id, createdAt });

    if (!signalResult.ok) {
      return signalResult;
    }

    await repository.create(signalResult.value);
    return signalResult;
  };
};
