// Copies the four contract data files and the contract types into src/generated.
// Runs before `dev`, `build` and `test` (see package.json).
//
// Source folder: data/processed when it holds all four files, otherwise data/fixtures.
// Set DATA_SOURCE=fixtures or DATA_SOURCE=processed to choose explicitly.

import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(appRoot, "..", "..");
const outDir = join(appRoot, "src", "generated");

const DATA_FILES = ["tests.json", "investigations.json", "scenarios.json", "meta.json"];
const SOURCES = ["processed", "fixtures"];

function hasAllFiles(source) {
  return DATA_FILES.every((name) => existsSync(join(repoRoot, "data", source, name)));
}

function pickSource() {
  const requested = process.env.DATA_SOURCE;
  if (requested) {
    if (!SOURCES.includes(requested)) {
      throw new Error(`DATA_SOURCE must be one of: ${SOURCES.join(", ")} (got "${requested}")`);
    }
    if (!hasAllFiles(requested)) {
      throw new Error(`data/${requested} does not contain all of: ${DATA_FILES.join(", ")}`);
    }
    return requested;
  }
  const found = SOURCES.find(hasAllFiles);
  if (!found) {
    throw new Error("Neither data/processed nor data/fixtures contains the four contract files");
  }
  return found;
}

const source = pickSource();
mkdirSync(outDir, { recursive: true });

for (const name of DATA_FILES) {
  copyFileSync(join(repoRoot, "data", source, name), join(outDir, name));
}
copyFileSync(join(repoRoot, "contracts", "types.ts"), join(outDir, "contract.ts"));
writeFileSync(join(outDir, "source.json"), JSON.stringify({ source }, null, 2) + "\n");

console.log(`sync-data: copied ${DATA_FILES.length} data files from data/${source} and the contract types`);
