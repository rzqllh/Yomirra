import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const baselinePath = path.join(rootDir, "scripts", "design-tokens-baseline.json");

if (!fs.existsSync(baselinePath)) {
  console.error("Baseline file not found:", baselinePath);
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf-8")).production;

function getProductionFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file === "node_modules" || file === ".git" || file === "__tests__") continue;
      results = results.concat(getProductionFiles(fullPath));
    } else {
      const ext = path.extname(file);
      if (ext === ".tsx" || ext === ".ts" || ext === ".css") {
        if (!file.includes(".test.") && !file.includes(".spec.")) {
          const normalized = fullPath.replace(/\\/g, "/");
          // Scope strictly to production surfaces (exclude /lab/ and /admin/)
          if (!normalized.includes("/lab/") && !normalized.includes("/admin/")) {
            results.push(fullPath);
          }
        }
      }
    }
  }
  return results;
}

const files = getProductionFiles(path.join(rootDir, "src"));

const current = {
  tailwind_arbitrary_brackets: 0,
  arbitrary_text_brackets: 0,
  arbitrary_rounded_brackets: 0,
  arbitrary_z_brackets: 0,
  zinc_bypasses: 0,
  raw_black_white_bypasses: 0,
  inline_styles: 0,
};

for (const file of files) {
  const content = fs.readFileSync(file, "utf-8");
  current.tailwind_arbitrary_brackets += (content.match(/\[-?[0-9.]+(px|rem|em|vh|vw|%|[a-z]+)\]/g) || []).length;
  current.arbitrary_text_brackets += (content.match(/text-\[[0-9.]+(px|rem)?\]/g) || []).length;
  current.arbitrary_rounded_brackets += (content.match(/rounded(?:-[a-z]+)?-\[[0-9.]+(px|rem)?\]/g) || []).length;
  current.arbitrary_z_brackets += (content.match(/z-\[[0-9]+\]/g) || []).length;
  current.zinc_bypasses += (content.match(/\b(?:bg|text|border|ring|fill|stroke)-zinc-[0-9]+\b/g) || []).length;
  current.raw_black_white_bypasses += (content.match(/\b(?:bg-black\/[0-9]+|text-white\b|bg-white\b|border-white\/[0-9]+)/g) || []).length;
  current.inline_styles += (content.match(/style=\{\{/g) || []).length;
}

console.log("=== DESIGN TOKEN RATCHET AUDIT (Production Surfaces) ===");
console.log(`Scanned ${files.length} production files.`);

let hasFailed = false;

for (const key of Object.keys(baseline)) {
  const baseVal = baseline[key];
  const curVal = current[key];
  const diff = curVal - baseVal;
  const status = diff > 0 ? "FAILED (INCREASED)" : diff < 0 ? "IMPROVED (DECREASED)" : "PASS (MAINTAINED)";

  console.log(`- ${key.padEnd(30)} Baseline: ${String(baseVal).padStart(4)} | Current: ${String(curVal).padStart(4)} | Diff: ${diff >= 0 ? "+" + diff : diff} [${status}]`);

  if (diff > 0) {
    hasFailed = true;
  }
}

if (hasFailed) {
  console.error("\n❌ Ratchet Failed: Production design contract arbitrary values have increased above baseline!");
  process.exit(1);
} else {
  console.log("\n✅ Ratchet Passed: No arbitrary value increases detected across production surfaces.");
}
