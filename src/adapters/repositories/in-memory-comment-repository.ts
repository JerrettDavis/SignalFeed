import type {
  Comment,
  CommentId,
  CommentRepository,
  CommentVote,
  CommentVoteType,
  NewComment,
  SightingId,
  UpdateComment,
  UserId,
} from "@/domain/comments/comment";

export class InMemoryCommentRepository implements CommentRepository {
  private comments: Map<CommentId, Comment> = new Map();
  private votes: Map<string, CommentVote> = new Map();

  async create(newComment: NewComment): Promise<Comment> {
    const id = `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` as CommentId;
    const now = new Date().toISOString();

    const comment: Comment = {
      id,
      sightingId: newComment.sightingId as SightingId,
      userId: newComment.userId as UserId,
      content: newComment.content,
      parentId: newComment.parentId as CommentId | undefined,
      createdAt: now,
      updatedAt: now,
      upvotes: 0,
      downvotes: 0,
      score: 0,
    };

    this.comments.set(id, comment);
    return comment;
  }

  async update(
    id: CommentId,
    update: UpdateComment
  ): Promise<Comment | null> {
    const comment = this.comments.get(id);
    if (!comment) {
      return null;
    }

    const updated: Comment = {
      ...comment,
      content: update.content,
      updatedAt: new Date().toISOString(),
    };

    this.comments.set(id, updated);
    return updated;
  }

  async delete(id: CommentId): Promise<boolean> {
    return this.comments.delete(id);
  }

  async getById(id: CommentId): Promise<Comment | null> {
    return this.comments.get(id) || null;
  }

  async getBySightingId(
    sightingId: SightingId,
    options?: { limit?: number; offset?: number }
  ): Promise<Comment[]> {
    const comments = Array.from(this.comments.values())
      .filter((c) => c.sightingId === sightingId)
      .sort((a, b) => {
        // Sort by score descending, then by date descending
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

    const offset = options?.offset || 0;
    const limit = options?.limit || comments.length;

    return comments.slice(offset, offset + limit);
  }

  async countBySightingId(sightingId: SightingId): Promise<number> {
    return Array.from(this.comments.values()).filter(
      (c) => c.sightingId === sightingId
    ).length;
  }

  async addVote(
    commentId: CommentId,
    userId: UserId,
    type: CommentVoteType
  ): Promise<void> {
    const voteKey = `${commentId}:${userId}`;
    const existingVote = this.votes.get(voteKey);

    // Remove old vote counts if changing vote type
    const comment = this.comments.get(commentId);
    if (!comment) {
      return;
    }

    if (existingVote) {
      if (existingVote.type === "upvote") {
        comment.upvotes--;
      } else {
        comment.downvotes--;
      }
    }

    // Add new vote
    const vote: CommentVote = {
      commentId,
      userId,
      type,
      createdAt: new Date().toISOString(),
    };

    this.votes.set(voteKey, vote);

    if (type === "upvote") {
      comment.upvotes++;
    } else {
      comment.downvotes++;
    }

    comment.score = comment.upvotes - comment.downvotes;
    this.comments.set(commentId, comment);
  }

  async removeVote(commentId: CommentId, userId: UserId): Promise<void> {
    const voteKey = `${commentId}:${userId}`;
    const vote = this.votes.get(voteKey);

    if (!vote) {
      return;
    }

    this.votes.delete(voteKey);

    const comment = this.comments.get(commentId);
    if (!comment) {
      return;
    }

    if (vote.type === "upvote") {
      comment.upvotes--;
    } else {
      comment.downvotes--;
    }

    comment.score = comment.upvotes - comment.downvotes;
    this.comments.set(commentId, comment);
  }

  async getUserVote(
    commentId: CommentId,
    userId: UserId
  ): Promise<CommentVote | null> {
    const voteKey = `${commentId}:${userId}`;
    return this.votes.get(voteKey) || null;
  }

  async getCommentVotes(
    commentId: CommentId
  ): Promise<{ upvotes: number; downvotes: number }> {
    const comment = this.comments.get(commentId);
    if (!comment) {
      return { upvotes: 0, downvotes: 0 };
    }
    return {
      upvotes: comment.upvotes,
      downvotes: comment.downvotes,
    };
  }
}
