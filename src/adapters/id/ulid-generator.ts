import { ulid } from "ulid";
import type { IdGenerator } from "@/ports/id-generator";

export const ulidGenerator: IdGenerator = {
  nextId: () => ulid(),
};
