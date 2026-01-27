import type {
  Category,
  CategoryId,
  Subcategory,
  SubcategoryId,
  SightingType,
  SightingTypeId,
  TaxonomyFilters,
} from "@/domain/taxonomy/taxonomy";

export type TaxonomyRepository = {
  // Categories
  getCategories: () => Promise<Category[]>;
  getCategoryById: (id: CategoryId) => Promise<Category | null>;

  // Subcategories
  getSubcategories: (categoryId?: CategoryId) => Promise<Subcategory[]>;
  getSubcategoryById: (id: SubcategoryId) => Promise<Subcategory | null>;

  // Types
  getTypes: (filters?: TaxonomyFilters) => Promise<SightingType[]>;
  getTypeById: (id: SightingTypeId) => Promise<SightingType | null>;

  // Tags
  getAllTags: () => Promise<string[]>;
};
