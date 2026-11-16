import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const bases = (process.env.VERIFY_BASE_URLS || "https://onepiecestudio.pages.dev")
  .split(",")
  .map(value => value.trim().replace(/\/$/, ""))
  .filter(Boolean);
const files = {
  "/": "dist/index.html",
  "/assets/motion-preflight.js": "dist/assets/motion-preflight.js",
  "/assets/motion.css": "dist/assets/motion.css",
  "/assets/motion.js": "dist/assets/motion.js"
};
const expectedVersion = readFileSync(path.join(root, "dist", "index.html"), "utf8")
  .match(/motion\.js\?v=([a-f0-9]{12})/)?.[1];
const failures = [];
const results = [];
const hash = value => createHash("sha256").update(value).digest("hex");

for (const [route, relative] of Object.entries(files)) {
  const expected = hash(readFileSync(path.join(root, relative)));
  for (const base of bases) {
    const response = await fetch(`${base}${route}?verify=${Date.now()}`, { cache: "no-store" });
    const bytes = Buffer.from(await response.arrayBuffer());
    const actual = hash(bytes);
    const cacheControl = response.headers.get("cache-control") || "";
    const csp = response.headers.get("content-security-policy") || "";
    const match = response.status === 200 && actual === expected;

    if (!match) failures.push(`${base}${route}: status or SHA-256 mismatch`);
    if (route === "/") {
      const html = bytes.toString("utf8");
      if (!expectedVersion || !html.includes(`motion.js?v=${expectedVersion}`)) failures.push(`${base}/: motion asset version mismatch`);
      if (!csp.includes("script-src 'self'")) failures.push(`${base}/: production CSP missing`);
      if (!/max-age=0|no-cache|no-store/i.test(cacheControl)) failures.push(`${base}/: HTML cache policy is not revalidated`);
    } else if (!/max-age=604800/i.test(cacheControl)) {
      failures.push(`${base}${route}: asset cache policy mismatch`);
    }

    results.push({ base, route, status: response.status, expected, actual, match, cacheControl, csp: route === "/" ? csp : undefined });
  }
}

const report = { checkedAt: new Date().toISOString(), bases, expectedVersion, failures, results };
mkdirSync(path.join(root, "qa"), { recursive: true });
writeFileSync(path.join(root, "qa", "online-motion-verification.json"), JSON.stringify(report, null, 2));

if (failures.length) {
  console.error(`Online verification failed with ${failures.length} issue(s):`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Online verification passed: ${bases.length} deployment(s), ${Object.keys(files).length} file hashes, CSP and cache policies.`);
