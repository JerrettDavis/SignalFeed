import type { CustomFieldValues } from "@/domain/sightings/sighting";

const isCustomFieldValue = (
  value: unknown
): value is CustomFieldValues[string] =>
  value === null ||
  typeof value === "string" ||
  typeof value === "number" ||
  typeof value === "boolean";

export const parseCustomFields = (value: unknown): CustomFieldValues => {
  const parsed =
    typeof value === "string"
      ? (() => {
          try {
            return JSON.parse(value) as unknown;
          } catch {
            return {};
          }
        })()
      : value;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(parsed).filter(([, fieldValue]) =>
      isCustomFieldValue(fieldValue)
    )
  );
};
