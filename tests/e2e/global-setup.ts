import path from "node:path";
import { promises as fs } from "node:fs";

const e2eDataDir = path.join(process.cwd(), ".local", "e2e");

export default async () => {
  await fs.rm(e2eDataDir, { recursive: true, force: true });
};
