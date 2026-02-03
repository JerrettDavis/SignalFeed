import { type CategoryId } from "@/domain/sightings/sighting";
import { type UserId } from "@/domain/users/user";
import { err, ok, type DomainError, type Result } from "@/shared/result";

export type UserCategoryInteractionId = string & {
  readonly __brand: "UserCategoryInteractionId";
};

export type UserCategoryInteraction = {
  id: UserCategoryInteractionId;
  userId: UserId;
  categoryId: CategoryId;
  clickCount: number;
  subscriptionCount: number;
  lastInteraction: string;
  createdAt: string;
};

export type NewUserCategoryInteraction = {
  userId: string;
  categoryId: string;
  clickCount?: number;
  subscriptionCount?: number;
};

const hasText = (value: string) => value.trim().length > 0;
const isIsoDate = (value: string) => Number.isFinite(Date.parse(value));

const validateUserId = (userId: string): Result<UserId, DomainError> => {
  if (!hasText(userId)) {
    return err({
      code: "user_category_interaction.user_id_required",
      message: "User ID is required.",
      field: "userId",
    });
  }
  return ok(userId as UserId);
};

const validateCategoryId = (
  categoryId: string
): Result<CategoryId, DomainError> => {
  if (!hasText(categoryId)) {
    return err({
      code: "user_category_interaction.category_id_required",
      message: "Category ID is required.",
      field: "categoryId",
    });
  }
  return ok(categoryId as CategoryId);
};

const validateCount = (
  count: number,
  field: string
): Result<number, DomainError> => {
  if (!Number.isInteger(count) || count < 0) {
    return err({
      code: "user_category_interaction.invalid_count",
      message: `${field} must be a non-negative integer.`,
      field,
    });
  }
  return ok(count);
};

export const createUserCategoryInteraction = (
  input: NewUserCategoryInteraction,
  context: { id: UserCategoryInteractionId; createdAt: string }
): Result<UserCategoryInteraction, DomainError> => {
  const userIdResult = validateUserId(input.userId);
  if (!userIdResult.ok) {
    return userIdResult;
  }

  const categoryIdResult = validateCategoryId(input.categoryId);
  if (!categoryIdResult.ok) {
    return categoryIdResult;
  }

  const clickCount = input.clickCount ?? 0;
  const clickCountResult = validateCount(clickCount, "clickCount");
  if (!clickCountResult.ok) {
    return clickCountResult;
  }

  const subscriptionCount = input.subscriptionCount ?? 0;
  const subscriptionCountResult = validateCount(
    subscriptionCount,
    "subscriptionCount"
  );
  if (!subscriptionCountResult.ok) {
    return subscriptionCountResult;
  }

  return ok({
    id: context.id,
    userId: userIdResult.value,
    categoryId: categoryIdResult.value,
    clickCount: clickCountResult.value,
    subscriptionCount: subscriptionCountResult.value,
    lastInteraction: context.createdAt,
    createdAt: context.createdAt,
  });
};

export const incrementClick = (
  existing: UserCategoryInteraction,
  context: { updatedAt: string }
): Result<UserCategoryInteraction, DomainError> => {
  if (!isIsoDate(context.updatedAt)) {
    return err({
      code: "user_category_interaction.invalid_timestamp",
      message: "Updated timestamp must be an ISO date string.",
      field: "updatedAt",
    });
  }

  return ok({
    ...existing,
    clickCount: existing.clickCount + 1,
    lastInteraction: context.updatedAt,
  });
};

export const incrementSubscription = (
  existing: UserCategoryInteraction,
  context: { updatedAt: string }
): Result<UserCategoryInteraction, DomainError> => {
  if (!isIsoDate(context.updatedAt)) {
    return err({
      code: "user_category_interaction.invalid_timestamp",
      message: "Updated timestamp must be an ISO date string.",
      field: "updatedAt",
    });
  }

  return ok({
    ...existing,
    subscriptionCount: existing.subscriptionCount + 1,
    lastInteraction: context.updatedAt,
  });
};

export const calculateInteractionScore = (
  interaction: UserCategoryInteraction
): number => {
  return interaction.clickCount + interaction.subscriptionCount * 2;
};
