import { z } from "zod";

export const CommentVoteTypeSchema = z.enum(["upvote", "downvote"]);

export const CreateCommentRequestSchema = z.object({
  sightingId: z.string().min(1),
  userId: z.string().min(1),
  content: z.string().min(1).max(5000),
  parentId: z.string().optional(),
});

export const UpdateCommentRequestSchema = z.object({
  content: z.string().min(1).max(5000),
});

export const CommentSchema = z.object({
  id: z.string(),
  sightingId: z.string(),
  userId: z.string(),
  content: z.string(),
  parentId: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  upvotes: z.number().default(0),
  downvotes: z.number().default(0),
  score: z.number().default(0),
});

export const CommentVoteSchema = z.object({
  commentId: z.string(),
  userId: z.string(),
  type: CommentVoteTypeSchema,
  createdAt: z.string().datetime(),
});

export const AddCommentVoteRequestSchema = z.object({
  userId: z.string().min(1),
  type: CommentVoteTypeSchema,
});

export type CreateCommentRequest = z.infer<typeof CreateCommentRequestSchema>;
export type UpdateCommentRequest = z.infer<typeof UpdateCommentRequestSchema>;
export type CommentResponse = z.infer<typeof CommentSchema>;
export type CommentVoteResponse = z.infer<typeof CommentVoteSchema>;
export type AddCommentVoteRequest = z.infer<typeof AddCommentVoteRequestSchema>;
