import type { FlairRepository } from "@/ports/flair-repository";
import type { Flair, FlairId, CreateFlairInput, FlairType } from "@/domain/flairs/flair";

class InMemoryFlairRepository implements FlairRepository {
  private flairs: Map<string, Flair> = new Map();

  async create(flair: Flair): Promise<void> {
    this.flairs.set(flair.id, flair);
  }

  async update(id: FlairId, updates: Partial<CreateFlairInput>): Promise<void> {
    const existing = this.flairs.get(id);
    if (!existing) {
      throw new Error("Flair not found");
    }
    this.flairs.set(id, { ...existing, ...updates } as Flair);
  }

  async delete(id: FlairId): Promise<void> {
    this.flairs.delete(id);
  }

  async getById(id: FlairId): Promise<Flair | null> {
    return this.flairs.get(id) || null;
  }

  async getAll(): Promise<Flair[]> {
    return Array.from(this.flairs.values());
  }

  async getSystemWideFlairs(): Promise<Flair[]> {
    return Array.from(this.flairs.values()).filter(
      (f) => !f.categoryId && f.isActive
    );
  }

  async getFlairsByCategory(categoryId: string): Promise<Flair[]> {
    return Array.from(this.flairs.values()).filter(
      (f) => f.categoryId === categoryId && f.isActive
    );
  }

  async getFlairsByType(type: FlairType): Promise<Flair[]> {
    return Array.from(this.flairs.values()).filter(
      (f) => f.flairType === type && f.isActive
    );
  }

  async getActiveFlairs(): Promise<Flair[]> {
    return Array.from(this.flairs.values()).filter((f) => f.isActive);
  }

  async getFlairsForCategory(categoryId: string): Promise<Flair[]> {
    return Array.from(this.flairs.values()).filter(
      (f) => (f.categoryId === categoryId || !f.categoryId) && f.isActive
    ).sort((a, b) => a.displayOrder - b.displayOrder);
  }
}

let instance: InMemoryFlairRepository | null = null;

export const inMemoryFlairRepository = (): FlairRepository => {
  if (!instance) {
    instance = new InMemoryFlairRepository();
  }
  return instance;
};
