import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const marker = "release.json";
const maxWaitMs = 75_000;
const requestMs = 10_000;
const batchSize = 8;
const publicFiles = [
  "robots.txt", "sitemap.xml", "site.webmanifest",
  "assets/styles.css", "assets/core-pages.css", "assets/site.js",
  "assets/motion-preflight.js", "assets/motion.css", "assets/motion.js"
];

function releaseMarker(sha) {
  if (!/^[a-f0-9]{40}$/.test(sha ?? "")) throw new Error("Expected a full 40-character Git commit SHA.");
  return Buffer.from(JSON.stringify({ sourceCommit: sha }) + "\n");
}

async function verify(origin, dist, sha, expectedMarker) {
  const base = new URL(origin);
  if (base.protocol !== "https:" || ![base.origin, base.origin + "/"].includes(origin)) {
    throw new Error("Expected an HTTPS origin with no path, credentials, query or fragment.");
  }
  if (!readFileSync(path.join(dist, marker)).equals(expectedMarker)) {
    throw new Error("Local release.json does not match the given source commit. Stamp the build first.");
  }

  const pages = readdirSync(dist, { recursive: true })
    .map(name => name.split(path.sep).join("/"))
    .filter(name => name === "index.html" || name.endsWith("/index.html"))
    .sort();
  if (!pages.includes("index.html")) throw new Error("The build is missing its homepage.");
  const expectedFiles = [...pages, ...publicFiles].map(name => ({
    route: "/" + (name.endsWith("index.html") ? name.slice(0, -"index.html".length) : name),
    bytes: readFileSync(path.join(dist, name))
  }));
  const deadline = performance.now() + maxWaitMs;
  let problems = [];

  for (let attempt = 1; performance.now() < deadline; attempt++) {
    const cacheKey = `${sha}-${Date.now()}-${attempt}`;
    async function check({ route, bytes }) {
      const url = new URL(route, base);
      url.searchParams.set("release", cacheKey);
      const timeout = Math.floor(Math.min(requestMs, deadline - performance.now()));
      if (timeout < 1) return `${route}: verification deadline exceeded`;
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(timeout), cache: "no-store", redirect: "error" });
        if (response.status !== 200) return `${route}: HTTP ${response.status}`;
        const actual = Buffer.from(await response.arrayBuffer());
        if (!actual.equals(bytes)) return `${route}: response differs from the expected build`;
        return null;
      } catch (error) {
        return `${route}: ${error.message}`;
      }
    }

    const markerProblem = await check({ route: "/" + marker, bytes: expectedMarker });
    problems = markerProblem ? [markerProblem] : [];
    if (!markerProblem) {
      for (let i = 0; i < expectedFiles.length && performance.now() < deadline; i += batchSize) {
        const results = await Promise.all(expectedFiles.slice(i, i + batchSize).map(check));
        problems.push(...results.filter(Boolean));
      }
      if (!problems.length && performance.now() < deadline) {
        console.log(`${base.origin}: release ${sha} verified across ${expectedFiles.length + 1} public files.`);
        return;
      }
    }
    console.warn(`${base.origin}: verification attempt ${attempt} did not pass: ${problems.slice(0, 4).join("; ") || "deadline exceeded"}`);
    await delay(Math.max(0, Math.min(4000, deadline - performance.now())));
  }
  throw new Error(`${base.origin} did not serve release ${sha} within ${maxWaitMs / 1000}s.`);
}

try {
  const [command, ...args] = process.argv.slice(2);
  if (command === "stamp" && args.length === 2) {
    const [dist, sha] = args;
    const body = releaseMarker(sha);
    readFileSync(path.join(dist, "index.html"));
    writeFileSync(path.join(dist, marker), body);
    console.log(`Stamped ${dist}/${marker} with release ${sha}.`);
  } else if (command === "verify" && args.length === 3) {
    const [origin, dist, sha] = args;
    await verify(origin, dist, sha, releaseMarker(sha));
  } else {
    throw new Error("Usage: stamp <dist-dir> <git-sha> OR verify <https-origin> <dist-dir> <git-sha>.");
  }
} catch (error) {
  console.error(`Release check failed: ${error.message}`);
  process.exitCode = 1;
}
