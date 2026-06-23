import { promises as fs } from "node:fs";
import path from "node:path";

export const getDataDir = () =>
  process.env.SIGNALFEED_DATA_DIR ??
  process.env.SIGHTSIGNAL_DATA_DIR ??
  path.join(process.cwd(), ".local");

/**
 * Resolve a file path and assert it stays within the configured data
 * directory. This prevents any path-traversal from reaching the filesystem
 * (defense-in-depth: all current callers pass constant filenames, but this
 * guarantees the invariant for future ones).
 */
const resolveWithinDataDir = (filePath: string): string => {
  const dataDir = path.resolve(getDataDir());
  const resolved = path.resolve(filePath);
  const relative = path.relative(dataDir, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Refusing to access file outside the data directory");
  }
  return resolved;
};

const ensureFile = async <T>(filePath: string, seed: T[]) => {
  const safePath = resolveWithinDataDir(filePath);
  await fs.mkdir(path.dirname(safePath), { recursive: true });
  try {
    await fs.access(safePath);
  } catch {
    await fs.writeFile(safePath, JSON.stringify(seed, null, 2), "utf-8");
  }
};

export const readCollection = async <T>(
  filePath: string,
  seed: T[]
): Promise<T[]> => {
  const safePath = resolveWithinDataDir(filePath);
  await ensureFile(safePath, seed);
  try {
    const raw = await fs.readFile(safePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as T[];
    }
  } catch {
    // Fall through to seed rewrite below.
  }

  await fs.writeFile(safePath, JSON.stringify(seed, null, 2), "utf-8");
  return seed;
};

export const writeCollection = async <T>(filePath: string, data: T[]) => {
  const safePath = resolveWithinDataDir(filePath);
  await fs.mkdir(path.dirname(safePath), { recursive: true });
  await fs.writeFile(safePath, JSON.stringify(data, null, 2), "utf-8");
};
