import type { FlairId } from "./flair";
import type { SightingId } from "../sightings/sighting";

export type FlairSuggestionId = string & {
  readonly __brand: "FlairSuggestionId";
};

export type SightingFlairAssignmentMethod =
  | "manual"
  | "auto"
  | "consensus"
  | "moderator";

export interface SightingFlair {
  readonly sightingId: SightingId;
  readonly flairId: FlairId;
  readonly assignedBy?: string; // user_id
  readonly assignedAt: Date;
  readonly assignmentMethod: SightingFlairAssignmentMethod;
  readonly metadata?: Record<string, unknown>;
}

export interface AssignFlairInput {
  readonly sightingId: string;
  readonly flairId: string;
  readonly assignedBy?: string;
  readonly assignmentMethod: SightingFlairAssignmentMethod;
  readonly metadata?: Record<string, unknown>;
}

export function validateFlairAssignment(input: AssignFlairInput): void {
  if (!input.sightingId || input.sightingId.trim() === "") {
    throw new Error("Sighting ID is required");
  }

  if (!input.flairId || input.flairId.trim() === "") {
    throw new Error("Flair ID is required");
  }

  const validMethods: SightingFlairAssignmentMethod[] = [
    "manual",
    "auto",
    "consensus",
    "moderator",
  ];
  if (!validMethods.includes(input.assignmentMethod)) {
    throw new Error(
      `Assignment method must be one of: ${validMethods.join(", ")}`
    );
  }

  // Validate that assignedBy is provided for manual and moderator methods
  if (
    (input.assignmentMethod === "manual" ||
      input.assignmentMethod === "moderator") &&
    !input.assignedBy
  ) {
    throw new Error(
      `assignedBy is required for ${input.assignmentMethod} assignment method`
    );
  }
}

export function createSightingFlair(input: AssignFlairInput): SightingFlair {
  validateFlairAssignment(input);

  return {
    sightingId: input.sightingId as SightingId,
    flairId: input.flairId as FlairId,
    assignedBy: input.assignedBy,
    assignedAt: new Date(),
    assignmentMethod: input.assignmentMethod,
    metadata: input.metadata,
  };
}

// Check if a user can assign a flair
export function canUserAssignFlair(
  userId: string,
  reporterId: string | undefined,
  isModerator: boolean,
  assignmentMethod: SightingFlairAssignmentMethod
): boolean {
  switch (assignmentMethod) {
    case "manual":
      // User must be the original reporter
      return reporterId === userId;
    case "moderator":
      // User must be a moderator
      return isModerator;
    case "auto":
      // System-assigned, not user-initiated
      return false;
    case "consensus":
      // Anyone can suggest, but not directly assign
      return true; // Can suggest, but actual assignment requires vote threshold
    default:
      return false;
  }
}

// Flair suggestion for community consensus

export type FlairSuggestionStatus = "pending" | "applied" | "rejected";

export interface FlairSuggestion {
  readonly id: FlairSuggestionId;
  readonly sightingId: SightingId;
  readonly flairId: FlairId;
  readonly suggestedBy: string;
  readonly suggestedAt: Date;
  readonly voteCount: number;
  readonly status: FlairSuggestionStatus;
}

export interface CreateFlairSuggestionInput {
  readonly sightingId: string;
  readonly flairId: string;
  readonly suggestedBy: string;
}

export function validateFlairSuggestion(
  input: CreateFlairSuggestionInput
): void {
  if (!input.sightingId || input.sightingId.trim() === "") {
    throw new Error("Sighting ID is required");
  }

  if (!input.flairId || input.flairId.trim() === "") {
    throw new Error("Flair ID is required");
  }

  if (!input.suggestedBy || input.suggestedBy.trim() === "") {
    throw new Error("Suggester user ID is required");
  }
}

export function createFlairSuggestion(
  input: CreateFlairSuggestionInput
): FlairSuggestion {
  validateFlairSuggestion(input);

  return {
    id: crypto.randomUUID() as FlairSuggestionId,
    sightingId: input.sightingId as SightingId,
    flairId: input.flairId as FlairId,
    suggestedBy: input.suggestedBy,
    suggestedAt: new Date(),
    voteCount: 0,
    status: "pending",
  };
}

// Check if a flair suggestion should be auto-applied based on votes
export function shouldAutoApplySuggestion(
  voteCount: number,
  sightingEngagement: number,
  thresholdPercentage: number = 0.1 // 10% of engaged users by default
): boolean {
  const minVotes = 3; // Minimum absolute votes required
  const calculatedThreshold = Math.max(
    minVotes,
    Math.ceil(sightingEngagement * thresholdPercentage)
  );
  return voteCount >= calculatedThreshold;
}
