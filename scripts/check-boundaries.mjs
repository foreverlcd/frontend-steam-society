#!/usr/bin/env node
// Architecture boundary check for the web (harness, see backend docs/HARNESS.md).
// Error messages tell the agent HOW to fix the violation. No dependencies.
import fs from "node:fs";
import path from "node:path";

const ROOT = "src";
const errors = [];
const isTest = (f) =>
  /\.test\.tsx?$/.test(f) || f.startsWith(path.join(ROOT, "test"));

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(p)) out.push(p);
  }
  return out;
}

// Resolve '@/x' and relative specifiers to a path under src/ (null for packages).
function resolve(file, spec) {
  if (spec.startsWith("@/")) return path.join(ROOT, spec.slice(2));
  if (spec.startsWith("."))
    return path.normalize(path.join(path.dirname(file), spec));
  return null;
}

const under = (p, dir) =>
  p === path.join(ROOT, dir) || p.startsWith(path.join(ROOT, dir) + path.sep);
const IMPORT_RE =
  /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

for (const file of walk(ROOT)) {
  if (isTest(file)) continue;
  const src = fs.readFileSync(file, "utf8");
  const at = (index) => `${file}:${src.slice(0, index).split("\n").length}`;

  // 1. Only the API client talks to the network.
  for (const m of src.matchAll(/\bfetch\s*\(/g)) {
    if (file !== path.join(ROOT, "lib/api/client.ts")) {
      errors.push(
        `${at(m.index)}: direct fetch().\n  FIX: add a typed function in src/lib/api/<domain>.ts that uses the shared client (src/lib/api/client.ts) so credentials, CSRF and ApiError normalization stay in one place.`,
      );
    }
  }

  for (const m of src.matchAll(IMPORT_RE)) {
    const spec = m[1] ?? m[2];
    const target = resolve(file, spec);
    if (!target) continue;

    // 2. lib/ is UI-free: it must never import components or app routes.
    if (
      under(file, "lib") &&
      (under(target, "components") || under(target, "app"))
    ) {
      errors.push(
        `${at(m.index)}: src/lib imports UI ('${spec}').\n  FIX: lib/ holds API calls, types and pure helpers. Move the UI piece into src/components/ and pass data to it as props.`,
      );
    }
    // 3. ui/ primitives are domain-agnostic.
    if (
      under(file, "components/ui") &&
      (under(target, "lib/api") ||
        (under(target, "components") && !under(target, "components/ui")))
    ) {
      errors.push(
        `${at(m.index)}: components/ui depends on '${spec}'.\n  FIX: ui/ primitives (atoms) must not know about the API or domain components. Accept props/children instead and do the wiring in components/<domain>/.`,
      );
    }
    // 4. Components never import route files.
    if (under(file, "components") && under(target, "app")) {
      errors.push(
        `${at(m.index)}: component imports a route file ('${spec}').\n  FIX: routes (src/app) compose components, never the reverse. Move shared code into src/components or src/lib.`,
      );
    }
  }
}

if (errors.length) {
  console.error(`check-boundaries: ${errors.length} violation(s)\n`);
  console.error(errors.join("\n\n"));
  console.error(
    "\nRules: AGENTS.md (UI) · Harness: ../backend-steam-society/docs/HARNESS.md",
  );
  process.exit(1);
}
console.log("check-boundaries: OK");
