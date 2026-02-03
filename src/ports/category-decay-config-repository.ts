import type { CategoryDecayConfig, CreateCategoryDecayConfigInput } from "@/domain/flairs/category-decay-config";
import type { CategoryId } from "@/domain/taxonomy/taxonomy";

export interface CategoryDecayConfigRepository {
  create(config: CategoryDecayConfig): Promise<void>;
  update(categoryId: CategoryId, updates: Partial<CreateCategoryDecayConfigInput>): Promise<void>;
  delete(categoryId: CategoryId): Promise<void>;
  getByCategory(categoryId: CategoryId): Promise<CategoryDecayConfig | null>;
  getAll(): Promise<CategoryDecayConfig[]>;
}
