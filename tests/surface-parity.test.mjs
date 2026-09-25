// The parity gate must fail closed, otherwise the drift it guards against is
// invisible: the root copy and locales/en-US/ are two ways of serving one
// English document, and a silent divergence means one host ships code the
// other host does not.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkParity, MIRRORED } from "../scripts/check-surface-parity.mjs";

function scratchTree(files) {
  const dir = mkdtempSync(join(tmpdir(), "bios-parity-"));
  for (const [rel, content] of Object.entries(files)) {
    const target = join(dir, rel);
    mkdirSync(join(target, ".."), { recursive: true });
    writeFileSync(target, content);
  }
  return dir;
}

test("the repository ships identical root and locales/en-US surfaces", () => {
  const problems = checkParity(process.cwd());
  assert.deepEqual(problems, [], `mirrored surfaces diverged:\n${problems.join("\n")}`);
});

test("a divergent mirrored file is reported", () => {
  const dir = scratchTree({
    "index.html": "<html>root</html>\n",
    "locales/en-US/index.html": "<html>stale copy</html>\n",
  });
  try {
    const problems = checkParity(dir);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /mirrored copies differ: index\.html/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a mirrored file missing from the locale copy is reported", () => {
  const dir = scratchTree({
    "index.html": "<html>root</html>\n",
    "locales/en-US/index.html": "<html>root</html>\n",
    "assets/js/india-language.js": "// root only\n",
  });
  try {
    const problems = checkParity(dir);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /mirrored file missing from locales\/en-US: assets\/js\/india-language\.js/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a locale-only copy without a root counterpart is reported", () => {
  const dir = scratchTree({ "locales/en-US/og-cover.jpg": "jpeg" });
  try {
    const problems = checkParity(dir);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /exists only in locales\/en-US: og-cover\.jpg/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the contract covers the whole English surface, not one file", () => {
  assert.ok(MIRRORED.includes("index.html"));
  assert.ok(MIRRORED.includes("assets/css/main.css"));
  assert.ok(MIRRORED.includes("assets/js/india-language.js"));
  assert.ok(MIRRORED.includes("assets/js/vendor/three.module.min.js"));
  assert.ok(MIRRORED.length >= 6, "the shared document, both stylesheets layers, the scripts and the cover must be listed");
});
