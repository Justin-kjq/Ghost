import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { writeFileAtomic } from "../src/atomic-write.js";

describe("writeFileAtomic", () => {
  it("creates a new file", () => {
    const dir = mkdtempSync(join(tmpdir(), "ghost-atomic-"));
    const file = join(dir, "credits.json");
    writeFileAtomic(file, '{"ok":true}');
    assert.equal(readFileSync(file, "utf8"), '{"ok":true}');
  });

  it("replaces an existing file without leaving a partial write", () => {
    const dir = mkdtempSync(join(tmpdir(), "ghost-atomic-"));
    const file = join(dir, "credits.json");
    writeFileSync(file, "OLD", "utf8");
    writeFileAtomic(file, JSON.stringify({ remaining: "1" }, null, 2));
    assert.equal(JSON.parse(readFileSync(file, "utf8")).remaining, "1");
    assert.equal(existsSync(`${file}.tmp`), false);
    assert.equal(existsSync(`${file}.bak`), false);
  });

  it("creates parent directories", () => {
    const dir = mkdtempSync(join(tmpdir(), "ghost-atomic-"));
    const file = join(dir, "nested", "a", "data.json");
    writeFileAtomic(file, "[]");
    assert.ok(existsSync(file));
  });
});
