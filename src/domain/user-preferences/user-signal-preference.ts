import { type SignalId } from "@/domain/signals/signal";
import { type UserId } from "@/domain/users/user";
import { err, ok, type DomainError, type Result } from "@/shared/result";

export type UserSignalPreferenceId = string & {
  readonly __brand: "UserSignalPreferenceId";
};

export type UserSignalPreference = {
  id: UserSignalPreferenceId;
  userId: UserId;
  signalId: SignalId;
  isHidden: boolean;
  isPinned: boolean;
  isUnimportant: boolean;
  customRank?: number;
  updatedAt: string;
};

export type NewUserSignalPreference = {
  userId: string;
  signalId: string;
  isHidden?: boolean;
  isPinned?: boolean;
  isUnimportant?: boolean;
  customRank?: number;
};

export type UpdateUserSignalPreference = Partial<{
  isHidden: boolean;
  isPinned: boolean;
  isUnimportant: boolean;
  customRank: number;
}>;

const hasText = (value: string) => value.trim().length > 0;
const isIsoDate = (value: string) => Number.isFinite(Date.parse(value));

const validateUserId = (userId: string): Result<UserId, DomainError> => {
  if (!hasText(userId)) {
    return err({
      code: "user_signal_preference.user_id_required",
      message: "User ID is required.",
      field: "userId",
    });
  }
  return ok(userId as UserId);
};

const validateSignalId = (signalId: string): Result<SignalId, DomainError> => {
  if (!hasText(signalId)) {
    return err({
      code: "user_signal_preference.signal_id_required",
      message: "Signal ID is required.",
      field: "signalId",
    });
  }
  return ok(signalId as SignalId);
};

const validateCustomRank = (
  rank: number | undefined
): Result<number | undefined, DomainError> => {
  if (rank === undefined) {
    return ok(undefined);
  }

  if (!Number.isInteger(rank) || rank < 0) {
    return err({
      code: "user_signal_preference.invalid_custom_rank",
      message: "Custom rank must be a non-negative integer.",
      field: "customRank",
    });
  }

  return ok(rank);
};

export const createUserSignalPreference = (
  input: NewUserSignalPreference,
  context: { id: UserSignalPreferenceId; createdAt: string }
): Result<UserSignalPreference, DomainError> => {
  const userIdResult = validateUserId(input.userId);
  if (!userIdResult.ok) {
    return userIdResult;
  }

  const signalIdResult = validateSignalId(input.signalId);
  if (!signalIdResult.ok) {
    return signalIdResult;
  }

  const customRankResult = validateCustomRank(input.customRank);
  if (!customRankResult.ok) {
    return customRankResult;
  }

  return ok({
    id: context.id,
    userId: userIdResult.value,
    signalId: signalIdResult.value,
    isHidden: input.isHidden ?? false,
    isPinned: input.isPinned ?? false,
    isUnimportant: input.isUnimportant ?? false,
    customRank: customRankResult.value,
    updatedAt: context.createdAt,
  });
};

export const updatePreference = (
  existing: UserSignalPreference,
  updates: UpdateUserSignalPreference,
  context: { updatedAt: string }
): Result<UserSignalPreference, DomainError> => {
  if (!isIsoDate(context.updatedAt)) {
    return err({
      code: "user_signal_preference.invalid_timestamp",
      message: "Updated timestamp must be an ISO date string.",
      field: "updatedAt",
    });
  }

  const customRank =
    updates.customRank !== undefined ? updates.customRank : existing.customRank;

  const customRankResult = validateCustomRank(customRank);
  if (!customRankResult.ok) {
    return customRankResult;
  }

  return ok({
    ...existing,
    isHidden: updates.isHidden ?? existing.isHidden,
    isPinned: updates.isPinned ?? existing.isPinned,
    isUnimportant: updates.isUnimportant ?? existing.isUnimportant,
    customRank: customRankResult.value,
    updatedAt: context.updatedAt,
  });
};
