// Surface parity gate.
//
// The Cloudflare Pages project publishes the same English landing document from
// two places: the repository root and locales/en-US/. They are not two
// versions of the site, they are two ways of serving one version, so any drift
// between them is a defect. Measured example: before this gate existed,
// locales/en-US/assets/js/india-language.js had lost two DOM hooks
// (sectionTitle and label) that the root copy carried, and nothing failed.
//
// Translated market documents (de-DE, pl-PL, af-ZA) are deliberately separate
// site versions and are not part of this contract; they share /assets from the
// root instead of duplicating them.

import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const MIRRORED = [
  "index.html",
  "assets/css/main.css",
  "assets/js/background.js",
  "assets/js/bg-scene.js",
  "assets/js/bg-scene-c.js",
  "assets/js/india-language.js",
  "assets/js/vendor/three.module.min.js",
  "og-cover.jpg",
];

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function checkParity(root) {
  const problems = [];
  for (const rel of MIRRORED) {
    const inRoot = join(root, rel);
    const inLocale = join(root, "locales", "en-US", rel);
    const rootExists = existsSync(inRoot);
    const localeExists = existsSync(inLocale);
    if (!rootExists && !localeExists) continue;
    if (!rootExists) {
      problems.push(`mirrored file exists only in locales/en-US: ${rel}`);
      continue;
    }
    if (!localeExists) {
      problems.push(`mirrored file missing from locales/en-US: ${rel}`);
      continue;
    }
    const a = sha256(inRoot);
    const b = sha256(inLocale);
    if (a !== b) {
      problems.push(`mirrored copies differ: ${rel} root=${a.slice(0, 12)} en-US=${b.slice(0, 12)}`);
    }
  }
  return problems;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const root = process.argv[2] ? process.argv[2] : process.cwd();
  const problems = checkParity(root);
  if (problems.length === 0) {
    console.log(`surface parity OK: ${MIRRORED.length} mirrored paths identical in root and locales/en-US`);
    process.exit(0);
  }
  console.error(`surface parity FAIL for ${root}:`);
  for (const line of problems) console.error(`  - ${line}`);
  process.exit(1);
}
