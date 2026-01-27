import postgres from "postgres";
import type { TaxonomyRepository } from "@/ports/taxonomy-repository";
import type {
  Category,
  CategoryId,
  Subcategory,
  SubcategoryId,
  SightingType,
  SightingTypeId,
  TaxonomyFilters,
} from "@/domain/taxonomy/taxonomy";

export const postgresTaxonomyRepository = (
  sql: ReturnType<typeof postgres>
): TaxonomyRepository => {
  return {
    async getCategories(): Promise<Category[]> {
      const rows = await sql`
        SELECT id, label, icon, description
        FROM categories
        ORDER BY label ASC
      `;

      return rows.map((row) => ({
        id: row.id as CategoryId,
        label: row.label,
        icon: row.icon,
        description: row.description,
      }));
    },

    async getCategoryById(id: CategoryId): Promise<Category | null> {
      const rows = await sql`
        SELECT id, label, icon, description
        FROM categories
        WHERE id = ${id}
      `;

      if (rows.length === 0) return null;

      const row = rows[0];
      return {
        id: row.id as CategoryId,
        label: row.label,
        icon: row.icon,
        description: row.description,
      };
    },

    async getSubcategories(categoryId?: CategoryId): Promise<Subcategory[]> {
      const rows = categoryId
        ? await sql`
            SELECT id, label, category_id, description
            FROM subcategories
            WHERE category_id = ${categoryId}
            ORDER BY label ASC
          `
        : await sql`
            SELECT id, label, category_id, description
            FROM subcategories
            ORDER BY label ASC
          `;

      return rows.map((row) => ({
        id: row.id as SubcategoryId,
        label: row.label,
        categoryId: row.category_id as CategoryId,
        description: row.description,
      }));
    },

    async getSubcategoryById(id: SubcategoryId): Promise<Subcategory | null> {
      const rows = await sql`
        SELECT id, label, category_id, description
        FROM subcategories
        WHERE id = ${id}
      `;

      if (rows.length === 0) return null;

      const row = rows[0];
      return {
        id: row.id as SubcategoryId,
        label: row.label,
        categoryId: row.category_id as CategoryId,
        description: row.description,
      };
    },

    async getTypes(filters?: TaxonomyFilters): Promise<SightingType[]> {
      let query = sql`
        SELECT id, label, category_id, subcategory_id, tags, icon
        FROM sighting_types
        WHERE 1=1
      `;

      if (filters?.categoryId) {
        query = sql`${query} AND category_id = ${filters.categoryId}`;
      }

      if (filters?.subcategoryId) {
        query = sql`${query} AND subcategory_id = ${filters.subcategoryId}`;
      }

      if (filters?.tags && filters.tags.length > 0) {
        // Match any of the provided tags
        query = sql`${query} AND tags && ${filters.tags}`;
      }

      query = sql`${query} ORDER BY label ASC`;

      const rows = await query;

      return rows.map((row) => ({
        id: row.id as SightingTypeId,
        label: row.label,
        categoryId: row.category_id as CategoryId,
        subcategoryId: row.subcategory_id as SubcategoryId | undefined,
        tags: row.tags || [],
        icon: row.icon,
      }));
    },

    async getTypeById(id: SightingTypeId): Promise<SightingType | null> {
      const rows = await sql`
        SELECT id, label, category_id, subcategory_id, tags, icon
        FROM sighting_types
        WHERE id = ${id}
      `;

      if (rows.length === 0) return null;

      const row = rows[0];
      return {
        id: row.id as SightingTypeId,
        label: row.label,
        categoryId: row.category_id as CategoryId,
        subcategoryId: row.subcategory_id as SubcategoryId | undefined,
        tags: row.tags || [],
        icon: row.icon,
      };
    },

    async getAllTags(): Promise<string[]> {
      const rows = await sql`
        SELECT DISTINCT unnest(tags) as tag
        FROM sighting_types
        WHERE tags IS NOT NULL
        ORDER BY tag ASC
      `;

      return rows.map((row) => row.tag);
    },
  };
};
