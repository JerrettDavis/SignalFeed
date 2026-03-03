export type FlairId = string & { readonly __brand: "FlairId" };

export type FlairType = "status" | "safety" | "urgency" | "resolution" | "community";

export type VisibilityImpact = "boost" | "neutral" | "suppress" | "hide";

export interface AutoAssignConditions {
  minScore?: number;
  maxScore?: number;
  minAge?: number; // hours
  maxAge?: number; // hours
  minEngagement?: number;
  requiredReactionTypes?: string[];
  spamReportThreshold?: number;
}

export interface Flair {
  readonly id: FlairId;
  readonly label: string;
  readonly description?: string;
  readonly icon?: string;
  readonly color: string;
  readonly categoryId?: string;
  readonly flairType: FlairType;
  readonly scoreModifier: number;
  readonly visibilityImpact: VisibilityImpact;
  readonly autoAssignConditions?: AutoAssignConditions;
  readonly displayOrder: number;
  readonly isActive: boolean;
  readonly createdAt: Date;
}

export interface CreateFlairInput {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly icon?: string;
  readonly color: string;
  readonly categoryId?: string;
  readonly flairType: FlairType;
  readonly scoreModifier?: number;
  readonly visibilityImpact?: VisibilityImpact;
  readonly autoAssignConditions?: AutoAssignConditions;
  readonly displayOrder?: number;
  readonly isActive?: boolean;
}

export function validateFlair(input: CreateFlairInput): void {
  if (!input.id || input.id.trim() === "") {
    throw new Error("Flair ID is required");
  }

  if (!input.label || input.label.trim() === "") {
    throw new Error("Flair label is required");
  }

  if (input.label.length > 50) {
    throw new Error("Flair label must be 50 characters or less");
  }

  if (!input.color || !/^#[0-9A-Fa-f]{6}$/.test(input.color)) {
    throw new Error("Flair color must be a valid hex color (e.g., #ef4444)");
  }

  const validFlairTypes: FlairType[] = ["status", "safety", "urgency", "resolution", "community"];
  if (!validFlairTypes.includes(input.flairType)) {
    throw new Error(`Flair type must be one of: ${validFlairTypes.join(", ")}`);
  }

  const validVisibilityImpacts: VisibilityImpact[] = ["boost", "neutral", "suppress", "hide"];
  if (input.visibilityImpact && !validVisibilityImpacts.includes(input.visibilityImpact)) {
    throw new Error(`Visibility impact must be one of: ${validVisibilityImpacts.join(", ")}`);
  }

  if (input.scoreModifier !== undefined && (input.scoreModifier < -10 || input.scoreModifier > 10)) {
    throw new Error("Score modifier must be between -10 and 10");
  }
}

export function createFlair(input: CreateFlairInput): Flair {
  validateFlair(input);

  return {
    id: input.id as FlairId,
    label: input.label.trim(),
    description: input.description?.trim(),
    icon: input.icon?.trim(),
    color: input.color,
    categoryId: input.categoryId,
    flairType: input.flairType,
    scoreModifier: input.scoreModifier ?? 0,
    visibilityImpact: input.visibilityImpact ?? "neutral",
    autoAssignConditions: input.autoAssignConditions,
    displayOrder: input.displayOrder ?? 0,
    isActive: input.isActive ?? true,
    createdAt: new Date(),
  };
}

export function isSystemWideFlair(flair: Flair): boolean {
  return flair.categoryId === undefined || flair.categoryId === null;
}

export function isCategorySpecificFlair(flair: Flair, categoryId: string): boolean {
  return flair.categoryId === categoryId;
}

export function getFlairsByType(flairs: Flair[], type: FlairType): Flair[] {
  return flairs.filter((f) => f.flairType === type && f.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getFlairsForCategory(flairs: Flair[], categoryId: string): Flair[] {
  return flairs
    .filter((f) => (f.categoryId === categoryId || isSystemWideFlair(f)) && f.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}
