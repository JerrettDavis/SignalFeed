import type { SightingFlair } from "@/domain/flairs/sighting-flair";
import type {
  FlairSuggestion,
  FlairSuggestionId,
  FlairSuggestionStatus,
} from "@/domain/flairs/sighting-flair";
import type { SightingId } from "@/domain/sightings/sighting";
import type { FlairId } from "@/domain/flairs/flair";

export interface SightingFlairRepository {
  // Sighting flair assignments
  assign(sightingFlair: SightingFlair): Promise<void>;
  remove(sightingId: SightingId, flairId: FlairId): Promise<void>;
  getFlairsForSighting(sightingId: SightingId): Promise<SightingFlair[]>;
  getSightingsWithFlair(flairId: FlairId): Promise<SightingId[]>;
  hasFlai(sightingId: SightingId, flairId: FlairId): Promise<boolean>;

  // Flair suggestions (community consensus)
  createSuggestion(suggestion: FlairSuggestion): Promise<void>;
  getSuggestion(id: FlairSuggestionId): Promise<FlairSuggestion | null>;
  getSuggestionsForSighting(sightingId: SightingId): Promise<FlairSuggestion[]>;
  updateSuggestionVotes(
    id: FlairSuggestionId,
    voteCount: number
  ): Promise<void>;
  updateSuggestionStatus(
    id: FlairSuggestionId,
    status: FlairSuggestionStatus
  ): Promise<void>;
  getPendingSuggestions(): Promise<FlairSuggestion[]>;
  getUserSuggestion(
    sightingId: SightingId,
    flairId: FlairId,
    userId: string
  ): Promise<FlairSuggestion | null>;
}
