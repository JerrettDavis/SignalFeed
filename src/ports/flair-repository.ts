import type { Flair, FlairId, CreateFlairInput, FlairType } from "@/domain/flairs/flair";

export interface FlairRepository {
  create(flair: Flair): Promise<void>;
  update(id: FlairId, updates: Partial<CreateFlairInput>): Promise<void>;
  delete(id: FlairId): Promise<void>;
  getById(id: FlairId): Promise<Flair | null>;
  getAll(): Promise<Flair[]>;
  getSystemWideFlairs(): Promise<Flair[]>;
  getFlairsByCategory(categoryId: string): Promise<Flair[]>;
  getFlairsByType(type: FlairType): Promise<Flair[]>;
  getActiveFlairs(): Promise<Flair[]>;
  getFlairsForCategory(categoryId: string): Promise<Flair[]>; // System-wide + category-specific
}
