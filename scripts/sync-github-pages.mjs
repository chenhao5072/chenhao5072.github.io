import { execFileSync } from "node:child_process";
import { copyFileSync, lstatSync, mkdirSync, readdirSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const project = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(project, "dist");
const [checkout, ...rest] = process.argv.slice(2);
if (!checkout || rest.length) throw new Error("Usage: node scripts/sync-github-pages.mjs <main-checkout>");
const destination = realpathSync(checkout);
const git = (...args) => execFileSync("git", ["-C", destination, ...args], { encoding: "utf8" }).trim();
const isPagesFile = /^(?:\.nojekyll|(?:404|index)\.html|release\.json|robots\.txt|sitemap\.xml|site\.webmanifest|assets\/[\w.-]+|(?:(?:en|ja)\/)?(?:about|careers|culture|projects|work)\/index\.html|(?:en|ja)\/(?:index|404)\.html)$/;
const cloudflareFiles = new Set(["_headers", "_redirects"]);
const remote = git("remote", "get-url", "origin");

if (destination === realpathSync(project) ||
    realpathSync(git("rev-parse", "--show-toplevel")) !== destination ||
    git("branch", "--show-current") !== "main" ||
    !/^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)chenhao5072\/chenhao5072\.github\.io(?:\.git)?$/i.test(remote)) {
  throw new Error("Use a separate main checkout of chenhao5072/chenhao5072.github.io.");
}
if (git("status", "--porcelain")) throw new Error("The main checkout must be clean before copying.");
execFileSync(process.execPath, [path.join(project, "scripts", "validate.mjs"), "--github-pages"], { stdio: "inherit" });

function list(dir, prefix = "") {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const relative = `${prefix}${entry.name}`;
    if (entry.isDirectory()) return list(path.join(dir, entry.name), `${relative}/`);
    if (entry.isFile()) return [relative];
    throw new Error(`Unexpected build entry: ${relative}`);
  });
}

const files = list(dist).filter(file => !cloudflareFiles.has(file));
if (files.some(file => !isPagesFile.test(file))) throw new Error("Unexpected release paths in dist.");
const stale = git("ls-files", "-z").split("\0").filter(file => isPagesFile.test(file) && !files.includes(file));
if (stale.length) throw new Error(`Review these obsolete generated files in main first: ${stale.join(", ")}`);

for (const file of files) {
  const target = path.join(destination, file);
  const parent = path.dirname(target);
  mkdirSync(parent, { recursive: true });
  const relativeParent = path.relative(destination, realpathSync(parent));
  if (relativeParent.startsWith("..") || path.isAbsolute(relativeParent) ||
      lstatSync(target, { throwIfNoEntry: false })?.isSymbolicLink()) {
    throw new Error(`Unsafe target path: ${file}`);
  }
  copyFileSync(path.join(dist, file), target);
}
console.log(`Copied ${files.length} generated GitHub Pages files. Review git status and diff before committing.`);
