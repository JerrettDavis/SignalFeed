import type {
  Signal,
  SignalId,
  SignalClassification,
} from "@/domain/signals/signal";
import type { UserRole, UserId } from "@/domain/users/user";
import type { SignalRepository } from "@/ports/signal-repository";
import type { UserRepository } from "@/ports/user-repository";
import type { Clock } from "@/ports/clock";
import { err, ok, type DomainError, type Result } from "@/shared/result";

export type ClassifySignalInput = {
  signalId: string;
  classification: SignalClassification;
  userId: string; // Admin performing the classification
};

export type ClassifySignal = (
  input: ClassifySignalInput
) => Promise<Result<Signal, DomainError>>;

type Dependencies = {
  signalRepository: SignalRepository;
  userRepository: UserRepository;
  clock: Clock;
};

/**
 * Classify Signal Use Case
 *
 * Allows administrators to change a signal's classification:
 * - personal: User-created signal (default)
 * - community: Popular signal promoted by moderators
 * - verified: Quality-stamped signal
 * - official: Admin-created official signal
 *
 * Only admins can classify signals.
 * This affects signal ranking (official > community > verified > personal).
 */
export const buildClassifySignal = ({
  signalRepository,
  userRepository,
  clock,
}: Dependencies): ClassifySignal => {
  return async (input) => {
    const { signalId, classification, userId } = input;

    // 1. Validate user is admin
    const user = await userRepository.getById(userId as UserId);
    if (!user) {
      return err({
        code: "user.not_found",
        message: "User not found.",
      });
    }

    if (user.role !== "admin") {
      return err({
        code: "signal.unauthorized",
        message: "Only administrators can classify signals.",
      });
    }

    // 2. Validate signal exists
    const signal = await signalRepository.getById(signalId as SignalId);
    if (!signal) {
      return err({
        code: "signal.not_found",
        message: "Signal not found.",
      });
    }

    // 3. Validate classification value
    const validClassifications: SignalClassification[] = [
      "official",
      "community",
      "personal",
      "verified",
    ];
    if (!validClassifications.includes(classification)) {
      return err({
        code: "signal.invalid_classification",
        message: `Invalid classification. Must be one of: ${validClassifications.join(", ")}`,
        field: "classification",
      });
    }

    // 4. Update signal classification
    const updated: Signal = {
      ...signal,
      classification,
      updatedAt: clock.now(),
    };

    await signalRepository.update(updated);

    return ok(updated);
  };
};
