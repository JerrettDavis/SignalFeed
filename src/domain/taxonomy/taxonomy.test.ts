import {
  validateCategoryId,
  validateSubcategoryId,
  validateSightingTypeId,
  filterTypesByCategory,
  filterTypesBySubcategory,
  filterTypesByTags,
  filterSubcategoriesByCategory,
  extractAllTags,
  findCategoryById,
  findSubcategoryById,
  findTypeById,
  type Category,
  type Subcategory,
  type SightingType,
  type CategoryId,
  type SubcategoryId,
  type SightingTypeId,
} from "@/domain/taxonomy/taxonomy";

describe("validateCategoryId", () => {
  it("accepts valid category ID", () => {
    const result = validateCategoryId("cat-safety");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("cat-safety");
    }
  });

  it("rejects empty string", () => {
    const result = validateCategoryId("");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("taxonomy.invalid_category_id");
      expect(result.error.field).toBe("categoryId");
    }
  });

  it("rejects whitespace-only string", () => {
    const result = validateCategoryId("   ");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("taxonomy.invalid_category_id");
    }
  });
});

describe("validateSubcategoryId", () => {
  it("accepts valid subcategory ID", () => {
    const result = validateSubcategoryId("sub-vehicle");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("sub-vehicle");
    }
  });

  it("rejects empty string", () => {
    const result = validateSubcategoryId("");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("taxonomy.invalid_subcategory_id");
      expect(result.error.field).toBe("subcategoryId");
    }
  });

  it("rejects whitespace-only string", () => {
    const result = validateSubcategoryId("  ");

    expect(result.ok).toBe(false);
  });
});

describe("validateSightingTypeId", () => {
  it("accepts valid sighting type ID", () => {
    const result = validateSightingTypeId("type-accident");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("type-accident");
    }
  });

  it("rejects empty string", () => {
    const result = validateSightingTypeId("");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("taxonomy.invalid_type_id");
      expect(result.error.field).toBe("typeId");
    }
  });

  it("rejects whitespace-only string", () => {
    const result = validateSightingTypeId("\t\n");

    expect(result.ok).toBe(false);
  });
});

describe("filterTypesByCategory", () => {
  const types: SightingType[] = [
    {
      id: "type-1" as SightingTypeId,
      label: "Type 1",
      categoryId: "cat-safety" as CategoryId,
      tags: [],
    },
    {
      id: "type-2" as SightingTypeId,
      label: "Type 2",
      categoryId: "cat-safety" as CategoryId,
      tags: [],
    },
    {
      id: "type-3" as SightingTypeId,
      label: "Type 3",
      categoryId: "cat-wildlife" as CategoryId,
      tags: [],
    },
  ];

  it("returns types matching category", () => {
    const filtered = filterTypesByCategory(types, "cat-safety" as CategoryId);

    expect(filtered).toHaveLength(2);
    expect(filtered[0].id).toBe("type-1");
    expect(filtered[1].id).toBe("type-2");
  });

  it("returns empty array for non-matching category", () => {
    const filtered = filterTypesByCategory(types, "cat-events" as CategoryId);

    expect(filtered).toHaveLength(0);
  });

  it("returns empty array for empty input", () => {
    const filtered = filterTypesByCategory([], "cat-safety" as CategoryId);

    expect(filtered).toHaveLength(0);
  });
});

describe("filterTypesBySubcategory", () => {
  const types: SightingType[] = [
    {
      id: "type-1" as SightingTypeId,
      label: "Type 1",
      categoryId: "cat-safety" as CategoryId,
      subcategoryId: "sub-vehicle" as SubcategoryId,
      tags: [],
    },
    {
      id: "type-2" as SightingTypeId,
      label: "Type 2",
      categoryId: "cat-safety" as CategoryId,
      subcategoryId: "sub-vehicle" as SubcategoryId,
      tags: [],
    },
    {
      id: "type-3" as SightingTypeId,
      label: "Type 3",
      categoryId: "cat-safety" as CategoryId,
      subcategoryId: "sub-pedestrian" as SubcategoryId,
      tags: [],
    },
    {
      id: "type-4" as SightingTypeId,
      label: "Type 4",
      categoryId: "cat-safety" as CategoryId,
      tags: [],
    },
  ];

  it("returns types matching subcategory", () => {
    const filtered = filterTypesBySubcategory(
      types,
      "sub-vehicle" as SubcategoryId
    );

    expect(filtered).toHaveLength(2);
    expect(filtered[0].id).toBe("type-1");
    expect(filtered[1].id).toBe("type-2");
  });

  it("excludes types without subcategory", () => {
    const filtered = filterTypesBySubcategory(
      types,
      "sub-vehicle" as SubcategoryId
    );

    expect(filtered.every((t) => t.subcategoryId !== undefined)).toBe(true);
  });

  it("returns empty array for non-matching subcategory", () => {
    const filtered = filterTypesBySubcategory(
      types,
      "sub-other" as SubcategoryId
    );

    expect(filtered).toHaveLength(0);
  });
});

describe("filterTypesByTags", () => {
  const types: SightingType[] = [
    {
      id: "type-1" as SightingTypeId,
      label: "Type 1",
      categoryId: "cat-safety" as CategoryId,
      tags: ["urgent", "vehicle"],
    },
    {
      id: "type-2" as SightingTypeId,
      label: "Type 2",
      categoryId: "cat-safety" as CategoryId,
      tags: ["urgent", "pedestrian"],
    },
    {
      id: "type-3" as SightingTypeId,
      label: "Type 3",
      categoryId: "cat-wildlife" as CategoryId,
      tags: ["nature", "animal"],
    },
    {
      id: "type-4" as SightingTypeId,
      label: "Type 4",
      categoryId: "cat-events" as CategoryId,
      tags: [],
    },
  ];

  it("returns types with any of the specified tags", () => {
    const filtered = filterTypesByTags(types, ["urgent"]);

    expect(filtered).toHaveLength(2);
    expect(filtered[0].id).toBe("type-1");
    expect(filtered[1].id).toBe("type-2");
  });

  it("returns types matching any tag (OR operation)", () => {
    const filtered = filterTypesByTags(types, ["vehicle", "animal"]);

    expect(filtered).toHaveLength(2);
    expect(filtered.map((t) => t.id)).toContain("type-1");
    expect(filtered.map((t) => t.id)).toContain("type-3");
  });

  it("excludes types with no tags", () => {
    const filtered = filterTypesByTags(types, ["urgent"]);

    expect(filtered.every((t) => t.tags.length > 0)).toBe(true);
  });

  it("returns empty array for non-matching tags", () => {
    const filtered = filterTypesByTags(types, ["nonexistent"]);

    expect(filtered).toHaveLength(0);
  });

  it("returns empty array for empty tag list", () => {
    const filtered = filterTypesByTags(types, []);

    expect(filtered).toHaveLength(0);
  });
});

describe("filterSubcategoriesByCategory", () => {
  const subcategories: Subcategory[] = [
    {
      id: "sub-1" as SubcategoryId,
      label: "Sub 1",
      categoryId: "cat-safety" as CategoryId,
    },
    {
      id: "sub-2" as SubcategoryId,
      label: "Sub 2",
      categoryId: "cat-safety" as CategoryId,
    },
    {
      id: "sub-3" as SubcategoryId,
      label: "Sub 3",
      categoryId: "cat-wildlife" as CategoryId,
    },
  ];

  it("returns subcategories matching category", () => {
    const filtered = filterSubcategoriesByCategory(
      subcategories,
      "cat-safety" as CategoryId
    );

    expect(filtered).toHaveLength(2);
    expect(filtered[0].id).toBe("sub-1");
    expect(filtered[1].id).toBe("sub-2");
  });

  it("returns empty array for non-matching category", () => {
    const filtered = filterSubcategoriesByCategory(
      subcategories,
      "cat-events" as CategoryId
    );

    expect(filtered).toHaveLength(0);
  });
});

describe("extractAllTags", () => {
  const types: SightingType[] = [
    {
      id: "type-1" as SightingTypeId,
      label: "Type 1",
      categoryId: "cat-safety" as CategoryId,
      tags: ["urgent", "vehicle"],
    },
    {
      id: "type-2" as SightingTypeId,
      label: "Type 2",
      categoryId: "cat-safety" as CategoryId,
      tags: ["urgent", "pedestrian"],
    },
    {
      id: "type-3" as SightingTypeId,
      label: "Type 3",
      categoryId: "cat-wildlife" as CategoryId,
      tags: ["nature", "animal"],
    },
  ];

  it("extracts unique tags from all types", () => {
    const tags = extractAllTags(types);

    expect(tags).toHaveLength(5);
    expect(tags).toContain("urgent");
    expect(tags).toContain("vehicle");
    expect(tags).toContain("pedestrian");
    expect(tags).toContain("nature");
    expect(tags).toContain("animal");
  });

  it("removes duplicate tags", () => {
    const tags = extractAllTags(types);

    expect(tags.filter((t) => t === "urgent")).toHaveLength(1);
  });

  it("returns sorted tags", () => {
    const tags = extractAllTags(types);

    const sortedTags = [...tags].sort();
    expect(tags).toEqual(sortedTags);
  });

  it("returns empty array for empty input", () => {
    const tags = extractAllTags([]);

    expect(tags).toHaveLength(0);
  });

  it("returns empty array for types with no tags", () => {
    const typesWithoutTags: SightingType[] = [
      {
        id: "type-1" as SightingTypeId,
        label: "Type 1",
        categoryId: "cat-safety" as CategoryId,
        tags: [],
      },
    ];

    const tags = extractAllTags(typesWithoutTags);

    expect(tags).toHaveLength(0);
  });
});

describe("findCategoryById", () => {
  const categories: Category[] = [
    {
      id: "cat-1" as CategoryId,
      label: "Category 1",
      description: "Description 1",
    },
    {
      id: "cat-2" as CategoryId,
      label: "Category 2",
      description: "Description 2",
    },
  ];

  it("finds category by ID", () => {
    const category = findCategoryById(categories, "cat-1" as CategoryId);

    expect(category).not.toBeNull();
    expect(category?.id).toBe("cat-1");
    expect(category?.label).toBe("Category 1");
  });

  it("returns null for non-existent ID", () => {
    const category = findCategoryById(categories, "cat-999" as CategoryId);

    expect(category).toBeNull();
  });

  it("returns null for empty array", () => {
    const category = findCategoryById([], "cat-1" as CategoryId);

    expect(category).toBeNull();
  });
});

describe("findSubcategoryById", () => {
  const subcategories: Subcategory[] = [
    {
      id: "sub-1" as SubcategoryId,
      label: "Subcategory 1",
      categoryId: "cat-1" as CategoryId,
    },
    {
      id: "sub-2" as SubcategoryId,
      label: "Subcategory 2",
      categoryId: "cat-1" as CategoryId,
    },
  ];

  it("finds subcategory by ID", () => {
    const subcategory = findSubcategoryById(
      subcategories,
      "sub-1" as SubcategoryId
    );

    expect(subcategory).not.toBeNull();
    expect(subcategory?.id).toBe("sub-1");
    expect(subcategory?.label).toBe("Subcategory 1");
  });

  it("returns null for non-existent ID", () => {
    const subcategory = findSubcategoryById(
      subcategories,
      "sub-999" as SubcategoryId
    );

    expect(subcategory).toBeNull();
  });
});

describe("findTypeById", () => {
  const types: SightingType[] = [
    {
      id: "type-1" as SightingTypeId,
      label: "Type 1",
      categoryId: "cat-1" as CategoryId,
      tags: [],
    },
    {
      id: "type-2" as SightingTypeId,
      label: "Type 2",
      categoryId: "cat-1" as CategoryId,
      tags: [],
    },
  ];

  it("finds type by ID", () => {
    const type = findTypeById(types, "type-1" as SightingTypeId);

    expect(type).not.toBeNull();
    expect(type?.id).toBe("type-1");
    expect(type?.label).toBe("Type 1");
  });

  it("returns null for non-existent ID", () => {
    const type = findTypeById(types, "type-999" as SightingTypeId);

    expect(type).toBeNull();
  });
});
