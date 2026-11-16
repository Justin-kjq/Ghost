import { existsSync, mkdirSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/**
 * Crash-safe replace: write to a sibling temp file, then rename into place.
 * On Windows, rename cannot overwrite, so we rotate via a `.bak` briefly.
 */
export function writeFileAtomic(filePath: string, contents: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  const tmp = `${filePath}.${process.pid}.tmp`;
  writeFileSync(tmp, contents, "utf8");

  try {
    renameSync(tmp, filePath);
    return;
  } catch {
    /* Windows (and some FS): cannot rename over an existing destination */
  }

  const bak = `${filePath}.bak`;
  try {
    if (existsSync(bak)) unlinkSync(bak);
  } catch {
    /* ignore */
  }
  if (existsSync(filePath)) {
    renameSync(filePath, bak);
  }
  renameSync(tmp, filePath);
  try {
    if (existsSync(bak)) unlinkSync(bak);
  } catch {
    /* ignore */
  }
}
