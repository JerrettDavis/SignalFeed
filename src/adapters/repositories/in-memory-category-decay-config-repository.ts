import type { CategoryDecayConfigRepository } from "@/ports/category-decay-config-repository";
import type { CategoryDecayConfig, CreateCategoryDecayConfigInput } from "@/domain/flairs/category-decay-config";
import type { CategoryId } from "@/domain/taxonomy/taxonomy";

class InMemoryCategoryDecayConfigRepository implements CategoryDecayConfigRepository {
  private configs: Map<string, CategoryDecayConfig> = new Map();

  async create(config: CategoryDecayConfig): Promise<void> {
    this.configs.set(config.categoryId, config);
  }

  async update(categoryId: CategoryId, updates: Partial<CreateCategoryDecayConfigInput>): Promise<void> {
    const existing = this.configs.get(categoryId);
    if (!existing) {
      throw new Error("Category decay config not found");
    }
    this.configs.set(categoryId, {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    } as CategoryDecayConfig);
  }

  async delete(categoryId: CategoryId): Promise<void> {
    this.configs.delete(categoryId);
  }

  async getByCategory(categoryId: CategoryId): Promise<CategoryDecayConfig | null> {
    return this.configs.get(categoryId) || null;
  }

  async getAll(): Promise<CategoryDecayConfig[]> {
    return Array.from(this.configs.values());
  }
}

let instance: InMemoryCategoryDecayConfigRepository | null = null;

export const inMemoryCategoryDecayConfigRepository = (): CategoryDecayConfigRepository => {
  if (!instance) {
    instance = new InMemoryCategoryDecayConfigRepository();
  }
  return instance;
};
