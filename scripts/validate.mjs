import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { locales, PAGE_KEYS } from "../src/content.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, "dist");
const githubPages = process.argv.includes("--github-pages");
const failures = [];
const checks = [];

function fail(message) { failures.push(message); }
function pass(message) { checks.push(message); }

function pageFile(localeKey, pageKey) {
  const base = localeKey === "zh" ? dist : path.join(dist, localeKey);
  return pageKey === "home" ? path.join(base, "index.html") : path.join(base, pageKey, "index.html");
}

function targetFor(reference) {
  const pathname = reference.split(/[?#]/)[0];
  const relative = pathname.replace(/^\//, "");
  if (!relative) return path.join(dist, "index.html");
  if (pathname.endsWith("/")) return path.join(dist, relative, "index.html");
  return path.join(dist, relative);
}

const productionPages = [];
const projectPlayerValues = {
  zh: ["620万", "200万", "14万"],
  ja: ["620万人", "200万人", "14万人"],
  en: ["6.2M", "2M", "140K"]
};

for (const [localeKey, locale] of Object.entries(locales)) {
  for (const pageKey of PAGE_KEYS) {
    const file = pageFile(localeKey, pageKey);
    const html = readFileSync(file, "utf8");
    productionPages.push(file);

    const prefix = `${localeKey}/${pageKey}`;
    if (!html.includes(`<html lang="${locale.lang}">`)) fail(`${prefix}: incorrect html lang`);
    if ((html.match(/<h1\b/g) || []).length !== 1) fail(`${prefix}: expected exactly one h1`);
    if ((html.match(/<title>/g) || []).length !== 1) fail(`${prefix}: expected one title`);
    if ((html.match(/name="description"/g) || []).length !== 1) fail(`${prefix}: expected one description`);
    if ((html.match(/name="google-site-verification"/g) || []).length !== (githubPages ? 0 : 1)) fail(`${prefix}: incorrect Google site verification tag count`);
    const robots = githubPages ? "noindex,follow" : "index,follow,max-image-preview:large";
    if (!html.includes(`<meta name="robots" content="${robots}">`)) fail(`${prefix}: incorrect robots policy for this build target`);
    if ((html.match(/rel="canonical"/g) || []).length !== 1) fail(`${prefix}: expected one canonical`);
    if ((html.match(/<link rel="alternate" hreflang=/g) || []).length !== 4) fail(`${prefix}: expected 3 locale alternates plus x-default`);
    if ((html.match(/class="nav-link"/g) || []).length !== 6) fail(`${prefix}: expected six primary nav links`);
    if ((html.match(/aria-current="page"/g) || []).length !== 1) fail(`${prefix}: expected one active page link`);
    if ((html.match(/aria-current="true"/g) || []).length !== 1) fail(`${prefix}: expected one active language link`);
    if ((html.match(/<main\b/g) || []).length !== 1 || (html.match(/<footer\b/g) || []).length !== 1) fail(`${prefix}: missing landmark`);
    if (/<style\b|style="|href="#"|\.\.\/exports|language-dialog/.test(html)) fail(`${prefix}: contains prototype-only or inline styling`);
    const motionPreflight = html.match(/<script src="\/assets\/motion-preflight\.js\?v=([a-f0-9]{12})"><\/script>/);
    const motionStyles = html.match(/<link rel="stylesheet" href="\/assets\/motion\.css\?v=([a-f0-9]{12})">/);
    const motionScript = html.match(/<script src="\/assets\/motion\.js\?v=([a-f0-9]{12})" defer><\/script>/);
    if (!motionPreflight || !motionStyles || !motionScript) fail(`${prefix}: production motion assets are missing or unversioned`);
    else if (new Set([motionPreflight[1], motionStyles[1], motionScript[1]]).size !== 1) fail(`${prefix}: motion asset versions do not match`);
    if (html.indexOf("/assets/motion-preflight.js") > html.indexOf("/assets/motion.css")) fail(`${prefix}: motion preflight must load before motion CSS`);

    if (pageKey === "projects") {
      const playerStats = [...html.matchAll(/class="projects-player-value"[^>]*>([\s\S]*?)<\/dd>/g)]
        .map(match => match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, ""));
      const storeLinks = [...html.matchAll(/<a class="projects-platform projects-store-button"[^>]+>/g)].map(match => match[0]);
      const appStoreLinks = storeLinks.filter(link => link.includes("https://apps.apple.com/"));
      const playStoreLinks = storeLinks.filter(link => link.includes("https://play.google.com/"));
      const iosItems = (html.match(/<strong>iOS<\/strong>/g) || []).length;
      const androidItems = (html.match(/<strong>Android<\/strong>/g) || []).length;
      if (JSON.stringify(playerStats) !== JSON.stringify(projectPlayerValues[localeKey])) fail(`${prefix}: player values are incomplete or misordered`);
      if (storeLinks.length !== 6 || appStoreLinks.length !== 3 || playStoreLinks.length !== 3 || iosItems !== 3 || androidItems !== 3) fail(`${prefix}: expected linked App Store and Google Play entry for all three projects`);
      if (storeLinks.some(link => !link.includes('target="_blank"') || !link.includes('rel="noopener noreferrer"') || !link.includes('aria-label="'))) fail(`${prefix}: store link security or accessible name is incomplete`);
      if (/TECHNICAL POLISH|tech-note|project-source|素材与技术精修/.test(html)) fail(`${prefix}: prototype technical-polish content leaked into production`);
      if (!html.includes('width="1180" height="360"')) fail(`${prefix}: logo intrinsic dimensions are incorrect`);
    }

    if (pageKey === "about") {
      if ((html.match(/class="dossier-row"/g) || []).length !== 6) fail(`${prefix}: company profile must contain exactly six rows`);
      if (/正式英文名称|业务方向|正式英語名|事業内容|Formal English Name|Business Direction/.test(html)) fail(`${prefix}: removed company profile fields are still visible`);
    }

    if (pageKey === "work" && /project-evidence-grid|project-evidence-item/.test(html)) fail(`${prefix}: repeated project cards remain on the work page`);
    if (pageKey === "culture" && (html.match(/class="culture-gallery(?:"|-)/g) || []).length < 3) fail(`${prefix}: culture gallery structure is incomplete`);

    const images = [...html.matchAll(/<img\b[^>]*>/g)].map(match => match[0]);
    if (images.some(image => !/\balt="[^"]*"/.test(image))) fail(`${prefix}: image without alt attribute`);

    const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    if (!jsonLd) fail(`${prefix}: missing Organization JSON-LD`);
    else {
      try { JSON.parse(jsonLd); } catch { fail(`${prefix}: invalid Organization JSON-LD`); }
    }

    const references = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(match => match[1]);
    for (const reference of references) {
      if (/^(https?:|mailto:|tel:|#)/.test(reference)) continue;
      const target = targetFor(reference);
      try { statSync(target); } catch { fail(`${prefix}: missing local reference ${reference}`); }
    }
  }
}

if (productionPages.length === 18) pass("18 localized production pages found");

for (const file of ["404.html", "ja/404.html", "en/404.html", "robots.txt", "sitemap.xml", "site.webmanifest", "_headers", "_redirects"]) {
  try { statSync(path.join(dist, file)); } catch { fail(`missing production file: ${file}`); }
}

const sitemap = readFileSync(path.join(dist, "sitemap.xml"), "utf8");
if ((sitemap.match(/<url>/g) || []).length !== 18) fail("sitemap must contain 18 URLs");
else pass("sitemap contains 18 URLs");

const headers = readFileSync(path.join(dist, "_headers"), "utf8");
for (const header of ["Content-Security-Policy", "Strict-Transport-Security", "X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy"]) {
  if (!headers.includes(header)) fail(`missing security header: ${header}`);
}

const redirects = readFileSync(path.join(dist, "_redirects"), "utf8");
if (!redirects.includes("/homepage.html / 301") || !redirects.includes("/zh/:splat /:splat 301")) fail("Cloudflare redirects are incomplete");
if (/301!|\s404(?:\s|$)/m.test(redirects)) fail("redirects contain unsupported Netlify or 404 rewrite syntax");

const css = readFileSync(path.join(dist, "assets", "styles.css"), "utf8");
const corePagesCss = readFileSync(path.join(dist, "assets", "core-pages.css"), "utf8");
const motionCss = readFileSync(path.join(dist, "assets", "motion.css"), "utf8");
const allCss = `${css}\n${corePagesCss}\n${motionCss}`;
if (/min-width:\s*1024px/.test(allCss)) fail("desktop-only min-width remains in production CSS");
if (/gradient\(/.test(allCss)) fail("gradient found in production CSS");
if (!css.includes("@media (max-width: 640px)") || !corePagesCss.includes("@media (max-width: 640px)")) fail("mobile breakpoint missing");
if (!motionCss.includes("prefers-reduced-motion: reduce")) fail("motion reduced-motion fallback missing");
if (!motionCss.includes("@media print")) fail("motion print fallback missing");

const budgets = {
  "assets/styles.css": 41000,
  "assets/core-pages.css": 24000,
  "assets/site.js": 10000,
  "assets/motion-preflight.js": 1000,
  "assets/motion.css": 16000,
  "assets/motion.js": 12000,
  "assets/og-image.png": 150000,
  "assets/logo-primary.svg": 20000
};
for (const [file, maxBytes] of Object.entries(budgets)) {
  const size = statSync(path.join(dist, file)).size;
  if (size > maxBytes) fail(`${file} exceeds ${maxBytes} byte budget (${size})`);
}

if (failures.length) {
  console.error(`Validation failed with ${failures.length} issue(s):`);
  failures.forEach(message => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`Validation passed: ${productionPages.length} pages, 3 localized 404 pages, complete local references, SEO and security files.`);
checks.forEach(message => console.log(`- ${message}`));
