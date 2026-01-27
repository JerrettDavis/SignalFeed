import type {
  Category,
  CategoryId,
  Subcategory,
  SubcategoryId,
  SightingType,
  SightingTypeId,
  TaxonomyFilters,
} from "@/domain/taxonomy/taxonomy";
import type { TaxonomyRepository } from "@/ports/taxonomy-repository";

type CategoryStore = Map<CategoryId, Category>;
type SubcategoryStore = Map<SubcategoryId, Subcategory>;
type TypeStore = Map<SightingTypeId, SightingType>;

const getCategoryStore = (): CategoryStore => {
  const globalAny = globalThis as { __sightsignal_categories?: CategoryStore };
  if (!globalAny.__sightsignal_categories) {
    globalAny.__sightsignal_categories = new Map<CategoryId, Category>();
  }
  return globalAny.__sightsignal_categories;
};

const getSubcategoryStore = (): SubcategoryStore => {
  const globalAny = globalThis as {
    __sightsignal_subcategories?: SubcategoryStore;
  };
  if (!globalAny.__sightsignal_subcategories) {
    globalAny.__sightsignal_subcategories = new Map<
      SubcategoryId,
      Subcategory
    >();
  }
  return globalAny.__sightsignal_subcategories;
};

const getTypeStore = (): TypeStore => {
  const globalAny = globalThis as { __sightsignal_types?: TypeStore };
  if (!globalAny.__sightsignal_types) {
    globalAny.__sightsignal_types = new Map<SightingTypeId, SightingType>();
  }
  return globalAny.__sightsignal_types;
};

export const inMemoryTaxonomyRepository = (): TaxonomyRepository => {
  const categoryStore = getCategoryStore();
  const subcategoryStore = getSubcategoryStore();
  const typeStore = getTypeStore();

  return {
    async getCategories() {
      return Array.from(categoryStore.values());
    },

    async getCategoryById(id) {
      return categoryStore.get(id) ?? null;
    },

    async getSubcategories(categoryId) {
      const subcategories = Array.from(subcategoryStore.values());

      // Filter by categoryId if provided
      if (categoryId) {
        return subcategories.filter((sub) => sub.categoryId === categoryId);
      }

      return subcategories;
    },

    async getSubcategoryById(id) {
      return subcategoryStore.get(id) ?? null;
    },

    async getTypes(filters) {
      let types = Array.from(typeStore.values());

      // Apply filters if provided
      if (filters) {
        if (filters.categoryId) {
          types = types.filter(
            (type) => type.categoryId === filters.categoryId
          );
        }

        if (filters.subcategoryId) {
          types = types.filter(
            (type) => type.subcategoryId === filters.subcategoryId
          );
        }

        if (filters.tags && filters.tags.length > 0) {
          types = types.filter((type) =>
            filters.tags!.some((tag) => type.tags.includes(tag))
          );
        }
      }

      return types;
    },

    async getTypeById(id) {
      return typeStore.get(id) ?? null;
    },

    async getAllTags() {
      const types = Array.from(typeStore.values());
      const tagSet = new Set<string>();

      types.forEach((type) => {
        type.tags.forEach((tag) => tagSet.add(tag));
      });

      return Array.from(tagSet).sort();
    },
  };
};
