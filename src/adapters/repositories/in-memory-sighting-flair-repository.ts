import type { SightingFlairRepository } from "@/ports/sighting-flair-repository";
import type { SightingFlair, FlairSuggestion, FlairSuggestionId, FlairSuggestionStatus } from "@/domain/flairs/sighting-flair";
import type { SightingId } from "@/domain/sightings/sighting";
import type { FlairId } from "@/domain/flairs/flair";

class InMemorySightingFlairRepository implements SightingFlairRepository {
  private sightingFlairs: Map<string, SightingFlair> = new Map();
  private suggestions: Map<string, FlairSuggestion> = new Map();

  private getKey(sightingId: SightingId, flairId: FlairId): string {
    return `${sightingId}-${flairId}`;
  }

  async assign(sightingFlair: SightingFlair): Promise<void> {
    const key = this.getKey(sightingFlair.sightingId, sightingFlair.flairId);
    this.sightingFlairs.set(key, sightingFlair);
  }

  async remove(sightingId: SightingId, flairId: FlairId): Promise<void> {
    const key = this.getKey(sightingId, flairId);
    this.sightingFlairs.delete(key);
  }

  async getFlairsForSighting(sightingId: SightingId): Promise<SightingFlair[]> {
    return Array.from(this.sightingFlairs.values()).filter(
      (sf) => sf.sightingId === sightingId
    );
  }

  async getSightingsWithFlair(flairId: FlairId): Promise<SightingId[]> {
    return Array.from(this.sightingFlairs.values())
      .filter((sf) => sf.flairId === flairId)
      .map((sf) => sf.sightingId);
  }

  async hasFlai(sightingId: SightingId, flairId: FlairId): Promise<boolean> {
    const key = this.getKey(sightingId, flairId);
    return this.sightingFlairs.has(key);
  }

  async createSuggestion(suggestion: FlairSuggestion): Promise<void> {
    this.suggestions.set(suggestion.id, suggestion);
  }

  async getSuggestion(id: FlairSuggestionId): Promise<FlairSuggestion | null> {
    return this.suggestions.get(id) || null;
  }

  async getSuggestionsForSighting(sightingId: SightingId): Promise<FlairSuggestion[]> {
    return Array.from(this.suggestions.values()).filter(
      (s) => s.sightingId === sightingId
    );
  }

  async updateSuggestionVotes(id: FlairSuggestionId, voteCount: number): Promise<void> {
    const suggestion = this.suggestions.get(id);
    if (!suggestion) {
      throw new Error("Suggestion not found");
    }
    this.suggestions.set(id, { ...suggestion, voteCount });
  }

  async updateSuggestionStatus(id: FlairSuggestionId, status: FlairSuggestionStatus): Promise<void> {
    const suggestion = this.suggestions.get(id);
    if (!suggestion) {
      throw new Error("Suggestion not found");
    }
    this.suggestions.set(id, { ...suggestion, status });
  }

  async getPendingSuggestions(): Promise<FlairSuggestion[]> {
    return Array.from(this.suggestions.values()).filter(
      (s) => s.status === "pending"
    );
  }

  async getUserSuggestion(
    sightingId: SightingId,
    flairId: FlairId,
    userId: string
  ): Promise<FlairSuggestion | null> {
    const suggestion = Array.from(this.suggestions.values()).find(
      (s) =>
        s.sightingId === sightingId &&
        s.flairId === flairId &&
        s.suggestedBy === userId
    );
    return suggestion || null;
  }
}

let instance: InMemorySightingFlairRepository | null = null;

export const inMemorySightingFlairRepository = (): SightingFlairRepository => {
  if (!instance) {
    instance = new InMemorySightingFlairRepository();
  }
  return instance;
};
