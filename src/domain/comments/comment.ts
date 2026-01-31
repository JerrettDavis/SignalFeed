import { err, ok, type DomainError, type Result } from "@/shared/result";

export type CommentId = string & { readonly __brand: "CommentId" };
export type SightingId = string & { readonly __brand: "SightingId" };
export type UserId = string & { readonly __brand: "UserId" };

export type NewComment = {
  sightingId: string;
  userId: string;
  content: string;
  parentId?: string;
};

export type UpdateComment = {
  content: string;
};

export type Comment = {
  id: CommentId;
  sightingId: SightingId;
  userId: UserId;
  content: string;
  parentId?: CommentId;
  createdAt: string;
  updatedAt: string;
  upvotes: number;
  downvotes: number;
  score: number;
};

export type CommentVoteType = "upvote" | "downvote";

export type CommentVote = {
  commentId: CommentId;
  userId: UserId;
  type: CommentVoteType;
  createdAt: string;
};

// Validation
export const validateCommentContent = (
  content: string
): Result<string, DomainError> => {
  if (!content || content.trim().length === 0) {
    return err({ code: "VALIDATION_ERROR", message: "Comment cannot be empty" });
  }
  if (content.length > 5000) {
    return err({
      code: "VALIDATION_ERROR",
      message: "Comment must be 5000 characters or less",
    });
  }
  return ok(content.trim());
};

export const validateUserId = (
  userId: string
): Result<string, DomainError> => {
  if (!userId || userId.trim().length === 0) {
    return err({ code: "VALIDATION_ERROR", message: "User ID is required" });
  }
  return ok(userId);
};

export const calculateCommentScore = (
  upvotes: number,
  downvotes: number
): number => {
  return upvotes - downvotes;
};

// Repository interface
export interface CommentRepository {
  create(comment: NewComment): Promise<Comment>;
  update(id: CommentId, update: UpdateComment): Promise<Comment | null>;
  delete(id: CommentId): Promise<boolean>;
  getById(id: CommentId): Promise<Comment | null>;
  getBySightingId(
    sightingId: SightingId,
    options?: { limit?: number; offset?: number }
  ): Promise<Comment[]>;
  countBySightingId(sightingId: SightingId): Promise<number>;
  
  // Voting
  addVote(commentId: CommentId, userId: UserId, type: CommentVoteType): Promise<void>;
  removeVote(commentId: CommentId, userId: UserId): Promise<void>;
  getUserVote(commentId: CommentId, userId: UserId): Promise<CommentVote | null>;
  getCommentVotes(commentId: CommentId): Promise<{ upvotes: number; downvotes: number }>;
}
