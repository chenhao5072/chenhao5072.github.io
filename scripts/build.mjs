import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { locales, PAGE_KEYS } from "../src/content.mjs";

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const srcDir = path.join(projectRoot, "src");
const distDir = path.join(projectRoot, "dist");
const siteUrl = (process.env.SITE_URL || "https://onepiecestudio.pages.dev").replace(/\/$/, "");
const githubPages = process.argv.includes("--github-pages");
const googleSiteVerification = "25ojcGxu8hY4rNnu2vGKqlsNws_mCySeZ-2dM_-z3O0";
const buildDate = new Date(process.env.SOURCE_DATE_EPOCH === undefined
  ? Date.now() : Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString().slice(0, 10);
const assetVersion = createHash("sha256")
  .update(readFileSync(path.join(srcDir, "styles.css")))
  .update(readFileSync(path.join(srcDir, "core-pages.css")))
  .update(readFileSync(path.join(srcDir, "site.js")))
  .update(readFileSync(path.join(srcDir, "motion-preflight.js")))
  .update(readFileSync(path.join(srcDir, "motion.css")))
  .update(readFileSync(path.join(srcDir, "motion.js")))
  .digest("hex")
  .slice(0, 12);

if (!distDir.startsWith(`${projectRoot}${path.sep}`)) {
  throw new Error(`Unsafe output directory: ${distDir}`);
}

const routes = {
  home: "/",
  about: "/about/",
  work: "/work/",
  culture: "/culture/",
  projects: "/projects/",
  careers: "/careers/"
};

const pageNumbers = { about: "01", work: "02", culture: "03", projects: "04", careers: "05" };

const projectAssets = {
  sumikko: {
    icon: ["/assets/project-sumikko-icon.webp", 512, 512],
    gallery: [
      ["/assets/project-sumikko-01.webp", 512, 288],
      ["/assets/project-sumikko-appstore-01.webp", 1175, 2088],
      ["/assets/project-sumikko-appstore-02.webp", 1175, 2088]
    ]
  },
  bank: {
    icon: ["/assets/project-bank-icon.webp", 512, 512],
    gallery: [
      ["/assets/project-bank-appstore-01.webp", 1242, 2688],
      ["/assets/project-bank-appstore-02.webp", 1242, 2688],
      ["/assets/project-bank-appstore-03.webp", 1242, 2688]
    ]
  },
  reverse: {
    icon: ["/assets/project-reverse-appstore-icon.webp", 1024, 1024],
    gallery: [
      ["/assets/project-reverse-01.webp", 1052, 592],
      ["/assets/project-reverse-02.webp", 1052, 592],
      ["/assets/project-reverse-03.webp", 1052, 592]
    ]
  }
};

function routeFor(localeKey, pageKey) {
  const base = localeKey === "zh" ? "" : `/${localeKey}`;
  return pageKey === "home" ? `${base}/` || "/" : `${base}${routes[pageKey]}`;
}

function outputFor(localeKey, pageKey) {
  const localeDir = localeKey === "zh" ? distDir : path.join(distDir, localeKey);
  if (pageKey === "home") return path.join(localeDir, "index.html");
  return path.join(localeDir, pageKey, "index.html");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function label([primary, secondary]) {
  return `<p class="section-label"><span>${escapeHtml(primary)}${secondary ? `<br>${escapeHtml(secondary)}` : ""}</span></p>`;
}

function button(text, href, variant = "primary") {
  return `<a class="button button-${variant}" href="${href}">${escapeHtml(text)}</a>`;
}

function paragraphs(items) {
  return `<div class="section-copy">${items.map(item => `<p>${escapeHtml(item)}</p>`).join("")}</div>`;
}

function linedRows(items) {
  return `<div class="lined-list">${items.map((item, index) => `
    <article class="lined-row">
      <span class="lined-row-number">${String(index + 1).padStart(2, "0")}</span>
      <h3>${escapeHtml(item[0])}</h3>
      <p>${escapeHtml(item[1])}</p>
    </article>`).join("")}
  </div>`;
}

function values(items) {
  return `<div class="value-grid">${items.map(item => `
    <article class="value-item">
      <span class="value-item-index">${escapeHtml(item[0])}</span>
      <h3>${escapeHtml(item[1])}</h3>
      <p>${escapeHtml(item[2])}</p>
    </article>`).join("")}
  </div>`;
}

function traits(items) {
  return `<div class="trait-grid">${items.map(item => `
    <article class="trait">
      <span>${escapeHtml(item[0])}</span>
      <h3>${escapeHtml(item[1])}</h3>
      <p>${escapeHtml(item[2])}</p>
    </article>`).join("")}
  </div>`;
}

function innerFacts(data) {
  if (!data?.facts?.length) return "";
  return `<section class="inner-facts${data.tone === "blue" ? " inner-facts-blue" : ""}" aria-label="${escapeHtml(data.factsAria)}">
    <div class="container inner-facts-grid" role="list">${data.facts.map((item, index) => `<div class="inner-fact" role="listitem">
      <span>${String(index + 1).padStart(2, "0")}</span><small>${escapeHtml(item[0])}</small><strong>${escapeHtml(item[1])}</strong>
    </div>`).join("")}</div>
  </section>`;
}

function principleStrip(items) {
  return `<div class="principle-strip">${items.map(item => `<article>
    <span>${escapeHtml(item[0])}</span><h3>${escapeHtml(item[1])}</h3><p>${escapeHtml(item[2])}</p>
  </article>`).join("")}</div>`;
}

function editorialColumns(items) {
  return `<div class="editorial-columns">${items.map(item => `<article>
    <span>${escapeHtml(item[0])}</span><h3>${escapeHtml(item[1])}</h3><p>${escapeHtml(item[2])}</p><small>${escapeHtml(item[3])}</small>
  </article>`).join("")}</div>`;
}

function projectEvidence(data, className = "") {
  return `<div class="project-evidence-grid${className ? ` ${className}` : ""}">${data.items.map(item => {
    const asset = projectAssets[item.id]?.gallery[item.assetIndex || 0];
    if (!asset) throw new Error(`Missing evidence image for project: ${item.id}`);
    const titleLang = item.titleLang ? ` lang="${escapeHtml(item.titleLang)}"` : "";
    return `<figure class="project-evidence-item">
      <div class="project-evidence-image">${projectImage(asset, item.imageAlt)}</div>
      <figcaption><small>${escapeHtml(item.eyebrow)}</small><h3${titleLang}>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.note)}</p></figcaption>
    </figure>`;
  }).join("")}</div>`;
}

function enhancedRows(items) {
  return `<div class="focus-list-enhanced">${items.map((item, index) => `<article>
    <span>${String(index + 1).padStart(2, "0")}</span><h3>${escapeHtml(item[0])}</h3><p>${escapeHtml(item[1])}</p><small>${escapeHtml(item[2])}</small>
  </article>`).join("")}</div>`;
}

function cultureValues(items) {
  return `<div class="culture-value-grid">${items.map(item => `<article>
    <span>${escapeHtml(item[0])}</span><h3>${escapeHtml(item[1])}</h3><p>${escapeHtml(item[2])}</p>
    <div><small>${escapeHtml(item[3])}</small><strong>${escapeHtml(item[4])}</strong></div>
  </article>`).join("")}</div>`;
}

function statement(items, tone = "blue") {
  return `<section class="section section-${tone} statement">
    <div class="container">
      <div class="statement-copy">
        <p>${escapeHtml(items[0])}</p>
        <small>${escapeHtml(items[1])}</small>
      </div>
      <img class="statement-mark" src="/assets/logo-mark.svg" alt="" aria-hidden="true">
    </div>
  </section>`;
}

function statusStage(data, buttonMarkup = "", contact = "") {
  return `<div class="status-stage">
    <div class="status-copy">
      <p class="status-kicker">${escapeHtml(data.kicker)}</p>
      <h2>${escapeHtml(data.statusTitle || data.title)}</h2>
      <p>${escapeHtml(data.statusBody || data.body)}</p>
      ${contact ? `<p class="status-contact">${escapeHtml(contact)}</p>` : ""}
      ${buttonMarkup ? `<div class="hero-actions">${buttonMarkup}</div>` : ""}
    </div>
    <div class="status-visual" aria-hidden="true">
      <div class="status-code">${data.code.map(escapeHtml).join("<br>")}</div>
      <img src="/assets/logo-mark.svg" alt="">
    </div>
  </div>`;
}

function pageHero(pageKey, data, localeKey) {
  const cultureClass = pageKey === "culture" ? " page-hero-blue" : "";
  const target = pageKey === "about" ? "work" : pageKey === "work" ? "projects" : pageKey === "culture" ? "careers" : pageKey === "careers" ? "culture" : null;
  return `<section class="page-hero${cultureClass}" aria-labelledby="page-title">
    <div class="page-hero-inner">
      <div class="page-hero-copy">
        <p class="eyebrow">${escapeHtml(data.eyebrow)}</p>
        <h1 id="page-title">${escapeHtml(data.title)}</h1>
        <p class="hero-lede">${escapeHtml(data.lede)}</p>
        ${data.button && target ? `<div class="hero-actions">${button(data.button, routeFor(localeKey, target), cultureClass ? "inverse" : "primary")}</div>` : ""}
      </div>
      <span class="page-hero-number" aria-hidden="true">${pageNumbers[pageKey]}</span>
      <img class="page-hero-mark" src="/assets/logo-mark.svg" alt="" aria-hidden="true">
    </div>
  </section>${innerFacts({ factsAria: data.factsAria, facts: data.facts, tone: cultureClass ? "blue" : "" })}`;
}

function renderHome(c, localeKey) {
  return `
    <section class="home-hero" aria-labelledby="home-title">
      <div class="home-hero-inner">
        <div class="home-hero-copy">
          <p class="eyebrow">${escapeHtml(c.hero.eyebrow)}</p>
          <h1 id="home-title">${escapeHtml(c.hero.title[0])} <span>${escapeHtml(c.hero.title[1])}</span>${escapeHtml(c.hero.title[2])}</h1>
          <p class="hero-lede">${escapeHtml(c.hero.lede)}</p>
          <p class="hero-signature" lang="ja">${escapeHtml(c.hero.signature)}</p>
          <div class="hero-actions">
            ${button(c.hero.primary, routeFor(localeKey, "about"))}
            ${button(c.hero.secondary, routeFor(localeKey, "work"), "secondary")}
          </div>
        </div>
        <div class="hero-mark-wrap" aria-hidden="true">
          <img class="hero-mark" src="/assets/logo-mark.svg" alt="">
          <div class="hero-locator">${c.hero.locator.map(escapeHtml).join("<br>")}</div>
        </div>
      </div>
    </section>

    <section class="facts-strip" aria-label="${escapeHtml(c.factsAria)}">
      <div class="container facts-grid">${c.facts.map((item, index) => `
        <div class="fact"><span class="fact-index">${String(index + 1).padStart(2, "0")}</span><div><strong>${escapeHtml(item[0])}</strong><small>${escapeHtml(item[1])}</small></div></div>`).join("")}
      </div>
    </section>

    <section class="section section-soft">
      <div class="container">
        <div class="section-heading">${label(c.about.label)}<h2 class="section-title">${escapeHtml(c.about.title)}</h2></div>
        ${paragraphs(c.about.paragraphs)}
        <div class="section-cta">${button(c.about.button, routeFor(localeKey, "about"), "secondary")}</div>
      </div>
    </section>

    <section class="section section-paper">
      <div class="container">
        <div class="section-heading">${label(c.work.label)}<h2 class="section-title">${escapeHtml(c.work.title)}</h2></div>
        ${linedRows(c.work.items)}
        <div class="section-cta">${button(c.work.button, routeFor(localeKey, "work"))}</div>
      </div>
    </section>

    <section class="section section-blue">
      <div class="container">
        <div class="section-heading">${label(c.culture.label)}<h2 class="section-title">${escapeHtml(c.culture.title)}</h2></div>
        ${values(c.culture.values)}
        <div class="section-cta">${button(c.culture.button, routeFor(localeKey, "culture"), "inverse")}</div>
      </div>
    </section>

    <section class="section section-soft">
      <div class="container">
        <div class="section-heading">${label(c.projects.label)}<h2 class="section-title">${escapeHtml(c.projects.title)}</h2></div>
        ${statusStage({ kicker: c.projects.kicker, statusTitle: c.projects.statusTitle, statusBody: c.projects.statusBody, code: c.projects.code }, button(c.projects.button, routeFor(localeKey, "projects"), "inverse"))}
      </div>
    </section>

    <section class="page-cta">
      <div class="container page-cta-inner">
        <div>${label(c.careers.label)}<h2>${escapeHtml(c.careers.title)}</h2><p>${escapeHtml(c.careers.body)}</p></div>
        <div class="cta-actions">${button(c.careers.button, routeFor(localeKey, "careers"))}</div>
      </div>
    </section>`;
}

function renderAboutLegacy(c, localeKey) {
  return `${pageHero("about", c.hero, localeKey)}
    <section class="section section-paper about-intro"><div class="container">
      <div class="section-heading">${label(c.who.label)}<h2 class="section-title">${escapeHtml(c.who.title)}</h2></div>
      ${paragraphs(c.who.paragraphs)}
      ${principleStrip(c.who.principles)}
    </div></section>
    <section class="section section-soft profile-rich"><div class="container">
      <div class="section-heading">${label(c.profile.label)}<h2 class="section-title">${escapeHtml(c.profile.title)}</h2></div>
      <div class="profile-layout">
        <dl class="compact-profile">${c.profile.rows.map(row => `<div><dt>${escapeHtml(row[0])}</dt><dd>${escapeHtml(row[1])}</dd></div>`).join("")}</dl>
        <aside class="location-panel" aria-label="${escapeHtml(c.profile.location.ariaLabel)}">
          <img src="/assets/logo-mark.svg" alt="" aria-hidden="true"><p class="location-kicker">${escapeHtml(c.profile.location.kicker)}</p>
          <strong>${escapeHtml(c.profile.location.city)}</strong><span>${escapeHtml(c.profile.location.address)}</span>
          <div class="location-meta"><small>${escapeHtml(c.profile.location.focus)}</small><small>${escapeHtml(c.profile.location.market)}</small></div>
        </aside>
      </div>
    </div></section>
    <section class="section section-paper about-projects"><div class="container">
      <div class="section-heading">${label(c.evidence.label)}<h2 class="section-title">${escapeHtml(c.evidence.title)}</h2></div>
      <div class="section-copy section-copy-single"><p>${escapeHtml(c.evidence.body)}</p></div>
      ${projectEvidence(c.evidence, "project-evidence-compact")}
      <a class="text-link" href="${routeFor(localeKey, "projects")}">${escapeHtml(c.evidence.button)}</a>
    </div></section>
    <section class="section section-soft about-together"><div class="container">
      <div class="section-heading">${label(c.together.label)}<h2 class="section-title">${escapeHtml(c.together.title)}</h2></div>
      ${editorialColumns(c.together.items)}
    </div></section>
    ${statement(c.statement)}
    <section class="section section-soft market-direction"><div class="container">
      <div class="section-heading">${label(c.market.label)}<h2 class="section-title">${escapeHtml(c.market.title)}</h2></div>
      ${paragraphs(c.market.paragraphs)}
      <div class="direction-track" role="list" aria-label="${escapeHtml(c.market.routeAria)}">${c.market.route.map(item => `<div role="listitem"><span>${escapeHtml(item[0])}</span><strong>${escapeHtml(item[1])}</strong><small>${escapeHtml(item[2])}</small></div>`).join("")}</div>
    </div></section>
    <section class="page-cta"><div class="container page-cta-inner">
      <div>${label(c.next.label)}<h2>${escapeHtml(c.next.title)}</h2></div>
      <div class="cta-actions">${button(c.next.primary, routeFor(localeKey, "work"))}${button(c.next.secondary, routeFor(localeKey, "careers"), "secondary")}</div>
    </div></section>`;
}

function renderWorkLegacy(c, localeKey) {
  return `${pageHero("work", c.hero, localeKey)}
    <section class="section section-paper work-core"><div class="container">
      <div class="section-heading">${label(c.core.label)}<h2 class="section-title">${escapeHtml(c.core.title)}</h2></div>
      ${paragraphs(c.core.paragraphs)}
      <div class="evidence-heading"><span>${escapeHtml(c.core.evidence.eyebrow)}</span><strong>${escapeHtml(c.core.evidence.title)}</strong></div>
      ${projectEvidence(c.core.evidence)}
      <a class="text-link" href="${routeFor(localeKey, "projects")}">${escapeHtml(c.core.evidence.button)}</a>
    </div></section>
    <section class="section section-soft work-focus"><div class="container">
      <div class="section-heading">${label(c.focus.label)}<h2 class="section-title">${escapeHtml(c.focus.title)}</h2></div>
      ${enhancedRows(c.focus.items)}
    </div></section>
    <section class="section section-paper work-process"><div class="container">
      <div class="section-heading">${label(c.process.label)}<h2 class="section-title">${escapeHtml(c.process.title)}</h2></div>
      <div class="process-track process-enriched">${c.process.steps.map(step => `<article class="process-step"><span>${escapeHtml(step[0])}</span><h3>${escapeHtml(step[1])}</h3><p>${escapeHtml(step[2])}</p><small>${escapeHtml(step[3])}</small></article>`).join("")}</div>
    </div></section>
    <section class="section section-blue market-lens"><div class="container">
      <div class="market-lens-lead">${label(c.market.label)}<div><h2>${escapeHtml(c.market.title)}</h2><p>${escapeHtml(c.market.body)}</p></div></div>
      <div class="market-lens-grid">${c.market.items.map(item => `<article><span>${escapeHtml(item[0])}</span><h3>${escapeHtml(item[1])}</h3><p>${escapeHtml(item[2])}</p></article>`).join("")}</div>
      <img class="market-lens-mark" src="/assets/logo-mark.svg" alt="" aria-hidden="true">
    </div></section>
    <section class="section section-soft work-collaboration"><div class="container">
      <div class="section-heading">${label(c.collaboration.label)}<h2 class="section-title">${escapeHtml(c.collaboration.title)}</h2></div>
      ${paragraphs(c.collaboration.paragraphs)}
      <div class="discipline-track">${c.collaboration.disciplines.map(item => `<span>${escapeHtml(item)}</span>`).join("")}</div>
    </div></section>
    <section class="page-cta"><div class="container page-cta-inner">
      <div>${label(c.next.label)}<h2>${escapeHtml(c.next.title)}</h2><p>${escapeHtml(c.next.body)}</p></div>
      <div class="cta-actions">${button(c.next.button, routeFor(localeKey, "projects"))}</div>
    </div></section>`;
}

function renderCultureLegacy(c, localeKey) {
  return `${pageHero("culture", c.hero, localeKey)}
    <section class="section section-blue culture-values"><div class="container">
      <div class="section-heading">${label(c.values.label)}<h2 class="section-title">${escapeHtml(c.values.title)}</h2></div>
      ${cultureValues(c.values.items)}
    </div></section>
    <section class="section section-paper culture-how"><div class="container">
      <div class="section-heading">${label(c.how.label)}<h2 class="section-title">${escapeHtml(c.how.title)}</h2></div>
      ${enhancedRows(c.how.items)}
    </div></section>
    <section class="section section-soft culture-practice"><div class="container">
      <div class="section-heading">${label(c.practice.label)}<h2 class="section-title">${escapeHtml(c.practice.title)}</h2></div>
      <p class="practice-lede">${escapeHtml(c.practice.body)}</p>
      <div class="practice-track">${c.practice.steps.map((item, index) => `<article><span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(item[0])}</strong><small>${escapeHtml(item[1])}</small></article>`).join("")}</div>
      <div class="culture-proof-strip" role="list" aria-label="${escapeHtml(c.practice.proofAria)}">${c.practice.proofs.map((item, index) => {
        if (!item.image || !item.width || !item.height) throw new Error(`Missing culture proof asset metadata: ${item.kicker}`);
        const asset = [item.image, item.width, item.height];
        return `<figure role="listitem"><div class="culture-proof-media">${projectImage(asset, item.imageAlt, `culture-proof-image culture-proof-image-${index + 1}`)}<span class="culture-proof-badge" aria-hidden="true">${escapeHtml(item.marker)}</span></div><figcaption><span>${escapeHtml(item.kicker)}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.note)}</small></figcaption></figure>`;
      }).join("")}</div>
    </div></section>
    ${statement(c.statement, "ink")}
    <section class="section section-soft culture-team"><div class="container">
      <div class="section-heading">${label(c.team.label)}<h2 class="section-title">${escapeHtml(c.team.title)}</h2></div>
      <div class="trait-grid enriched-traits">${c.team.traits.map(item => `<article class="trait"><span>${escapeHtml(item[0])}</span><h3>${escapeHtml(item[1])}</h3><p>${escapeHtml(item[2])}</p><small>${escapeHtml(item[3])}</small></article>`).join("")}</div>
    </div></section>
    <section class="page-cta"><div class="container page-cta-inner">
      <div>${label(c.next.label)}<h2>${escapeHtml(c.next.title)}</h2><p>${escapeHtml(c.next.body)}</p></div>
      <div class="cta-actions">${button(c.next.primary, routeFor(localeKey, "careers"))}${button(c.next.secondary, routeFor(localeKey, "about"), "secondary")}</div>
    </div></section>`;
}

function editorialLabel([primary, secondary], dark = false) {
  return `<p class="eyebrow${dark ? " on-dark" : ""}">${escapeHtml(primary)}${secondary ? `<br>${escapeHtml(secondary)}` : ""}</p>`;
}

function renderAbout(c) {
  const d = c.redesign;
  return `<section class="studio-hero about-hero" aria-labelledby="page-title">
    <div class="studio-hero-inner">
      <div class="studio-hero-copy page-hero-copy">
        <p class="eyebrow">${escapeHtml(d.hero.eyebrow)}</p>
        <h1 id="page-title">${escapeHtml(d.hero.title[0])}<br><span>${escapeHtml(d.hero.title[1])}</span></h1>
        <p class="hero-lede">${escapeHtml(d.hero.lede)}</p>
      </div>
    </div>
    <img class="studio-hero-mark" src="/assets/logo-mark.svg" alt="" aria-hidden="true">
    <div class="hero-facts" role="list" aria-label="${escapeHtml(d.hero.factsAria)}">${d.hero.facts.map(item => `<div class="hero-fact" role="listitem"><small>${escapeHtml(item[0])}</small><strong>${escapeHtml(item[1])}</strong><span>${escapeHtml(item[2])}</span></div>`).join("")}</div>
  </section>
  <section class="section section-rock"><div class="container mission-layout">
    ${editorialLabel(d.mission.label, true)}
    <div class="mission-copy"><h2>${escapeHtml(d.mission.titleLead)}<em>${escapeHtml(d.mission.titleEmphasis)}</em>${escapeHtml(d.mission.titleTail)}</h2><p>${escapeHtml(d.mission.body)}</p></div>
  </div></section>
  <section class="section section-paper"><div class="container">
    <div class="section-heading">${editorialLabel(d.profile.label)}<div><h2>${escapeHtml(d.profile.title)}</h2><p>${escapeHtml(d.profile.body)}</p></div></div>
    <div class="dossier-grid">
      <dl class="dossier-list">${d.profile.rows.map(row => `<div class="dossier-row"><dt>${escapeHtml(row[0])}</dt><dd>${escapeHtml(row[1])}</dd></div>`).join("")}</dl>
      <aside class="location-panel" aria-label="${escapeHtml(d.profile.location.ariaLabel)}"><small>${escapeHtml(d.profile.location.kicker)}</small><h3>${escapeHtml(d.profile.location.city)}</h3><p>${escapeHtml(d.profile.location.address)}<br>${escapeHtml(d.profile.location.detail)}</p><div class="location-coordinates">${escapeHtml(d.profile.location.coordinates)}<br>${escapeHtml(d.profile.location.market)}</div><img src="/assets/logo-mark.svg" alt="" aria-hidden="true"></aside>
    </div>
  </div></section>
  <section class="section section-soft"><div class="container">
    <div class="discipline-intro"><h2>${escapeHtml(d.disciplines.title)}</h2><p>${escapeHtml(d.disciplines.body)}</p></div>
    <div class="discipline-strip">${d.disciplines.items.map(item => `<article class="discipline"><span>${escapeHtml(item[0])}</span><h3>${escapeHtml(item[1])}</h3></article>`).join("")}</div>
  </div></section>`;
}

function renderWork(c, localeKey) {
  const d = c.redesign;
  return `<section class="studio-hero work-hero" aria-labelledby="page-title">
    <div class="studio-hero-inner"><div class="studio-hero-copy page-hero-copy"><p class="eyebrow">${escapeHtml(d.hero.eyebrow)}</p><h1 id="page-title">${escapeHtml(d.hero.title[0])}<br><span>${escapeHtml(d.hero.title[1])}</span></h1><p class="hero-lede">${escapeHtml(d.hero.lede)}</p></div></div>
    <div class="work-hero-track" aria-hidden="true"><span>PRODUCT</span><i></i><span>PLAN</span><i></i><span>BUILD</span><i></i><span>QUALITY</span><i></i><span>OPERATE</span></div>
    <div class="studio-hero-index" aria-hidden="true">02</div>
  </section>
  <section class="section section-paper"><div class="container">
    <div class="section-heading">${editorialLabel(d.delivery.label)}<div><h2>${escapeHtml(d.delivery.title)}</h2><p>${escapeHtml(d.delivery.body)}</p></div></div>
    <div class="capability-track">${d.delivery.capabilities.map(item => `<article class="capability-row"><span>${escapeHtml(item[0])}</span><h3>${escapeHtml(item[1])}</h3><p>${escapeHtml(item[2])}</p></article>`).join("")}</div>
  </div></section>
  <section class="section section-ink"><div class="container">
    <div class="section-heading">${editorialLabel(d.judgment.label, true)}<div><h2>${escapeHtml(d.judgment.title)}</h2><p>${escapeHtml(d.judgment.body)}</p></div></div>
    <div class="quality-lines">${d.judgment.items.map(item => `<article class="quality-row"><strong>${escapeHtml(item[0])}</strong><p>${escapeHtml(item[1])}</p><small>${escapeHtml(item[2])}</small></article>`).join("")}</div>
  </div></section>
  <section class="section section-rock market-band"><div class="container market-layout">${editorialLabel(d.market.label, true)}<div><h2>${escapeHtml(d.market.title)}</h2><p>${escapeHtml(d.market.body)}</p></div></div></section>
  <section class="section section-soft"><div class="container"><div class="proof-band">${d.proof.items.map(item => `<div class="proof-item"><span>${escapeHtml(item[0])}</span><strong>${escapeHtml(item[1])}</strong></div>`).join("")}<a class="proof-link" href="${routeFor(localeKey, "projects")}">${escapeHtml(d.proof.button)}&nbsp;&nbsp;→</a></div></div></section>`;
}

function renderCulture(c) {
  const d = c.redesign;
  const proof = (item, className = "") => `<figure${className ? ` class="${className}"` : ""}><img src="${item[3]}" alt="${escapeHtml(item[2])}" width="${item[4]}" height="${item[5]}" loading="lazy" decoding="async"><figcaption><span>${escapeHtml(item[0])}</span><strong>${escapeHtml(item[1])}</strong></figcaption></figure>`;
  return `<section class="culture-hero" aria-labelledby="page-title">
    <img src="${d.hero.image}" alt="${escapeHtml(d.hero.imageAlt)}" width="${d.hero.width}" height="${d.hero.height}" fetchpriority="high" decoding="async">
    <div class="container"><div class="culture-copy page-hero-copy"><p class="eyebrow on-dark">${escapeHtml(d.hero.eyebrow)}</p><h1 id="page-title">${escapeHtml(d.hero.title)}</h1><p>${escapeHtml(d.hero.lede)}</p></div></div>
    <div class="culture-words">${escapeHtml(d.hero.words)}</div>
  </section>
  <section class="section section-paper"><div class="container value-editorial">${editorialLabel(d.values.label)}<div class="value-list">${d.values.items.map(item => `<article class="value-line"><span>${escapeHtml(item[0])}</span><h3>${escapeHtml(item[1])}</h3><p>${escapeHtml(item[2])}</p></article>`).join("")}</div></div></section>
  <section class="section section-soft"><div class="container">
    <div class="section-heading">${editorialLabel(d.practice.label)}<div><h2>${escapeHtml(d.practice.title)}</h2></div></div>
    <div class="culture-gallery">${proof(d.practice.proofs[0], "culture-gallery-main")}<div class="culture-gallery-side">${d.practice.proofs.slice(1).map(item => proof(item)).join("")}</div></div>
  </div></section>
  <section class="section section-rock"><div class="container behavior-layout"><div class="behavior-intro">${editorialLabel(d.behavior.label, true)}<h2>${escapeHtml(d.behavior.title)}</h2><p>${escapeHtml(d.behavior.body)}</p></div><div class="behavior-list">${d.behavior.items.map(item => `<article class="behavior-row"><span>${escapeHtml(item[0])}</span><strong>${escapeHtml(item[1])}</strong><p>${escapeHtml(item[2])}</p></article>`).join("")}</div></div></section>
  <section class="section section-paper"><div class="container culture-close"><small>${escapeHtml(d.closing.kicker)}</small><h2>${escapeHtml(d.closing.title)}</h2><p>${escapeHtml(d.closing.body)}</p></div></section>`;
}

function projectImage(asset, alt, className = "") {
  const [src, width, height] = asset;
  return `<img${className ? ` class="${className}"` : ""} src="${src}" alt="${escapeHtml(alt)}" width="${width}" height="${height}" loading="lazy" decoding="async">`;
}

function projectsHero(data) {
  return `<section class="projects-hero" aria-labelledby="page-title">
    <div class="container projects-hero-grid">
      <div class="projects-hero-copy">
        <p class="eyebrow">${escapeHtml(data.eyebrow)}</p>
        <h1 id="page-title">${escapeHtml(data.title[0])} <span>${escapeHtml(data.title[1])}</span></h1>
        <p class="hero-lede">${escapeHtml(data.lede)}</p>
      </div>
      <div class="projects-hero-index" aria-hidden="true"><strong>04</strong><span>PROJECTS</span></div>
    </div>
    <div class="projects-facts-wrap">
      <div class="container projects-facts" role="list" aria-label="${escapeHtml(data.factsAria)}">
        ${data.facts.map((fact, index) => `<div role="listitem"><span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(fact[0])}</strong><small>${escapeHtml(fact[1])}</small></div>`).join("")}
      </div>
    </div>
  </section>`;
}

function projectGallery(work, assets) {
  const images = assets.gallery.map((asset, index) => projectImage(asset, work.imageAlts[index]));
  if (work.id === "sumikko") {
    return `<div class="projects-gallery projects-gallery-sumikko" role="group" aria-label="${escapeHtml(work.galleryLabel)}">
      <figure class="projects-sumikko-feature">${images[0]}</figure>
      <div class="projects-sumikko-phones">${images.slice(1).map(image => `<figure>${image}</figure>`).join("")}</div>
      <p class="projects-gallery-note" aria-hidden="true">PUZZLE · COLLECTION · JOY</p>
    </div>`;
  }
  if (work.id === "bank") {
    return `<div class="projects-gallery projects-gallery-bank-appstore" role="group" aria-label="${escapeHtml(work.galleryLabel)}">
      ${images.map((image, index) => `<figure class="projects-bank-phone projects-bank-phone-${index + 1}">${image}</figure>`).join("")}
    </div>`;
  }
  return `<div class="projects-gallery projects-gallery-reverse" role="group" aria-label="${escapeHtml(work.galleryLabel)}">
    <figure class="projects-reverse-main">${images[0]}</figure><figure>${images[1]}</figure><figure>${images[2]}</figure>
  </div>`;
}

function projectShowcase(work, labels) {
  const assets = projectAssets[work.id];
  if (!assets) throw new Error(`Missing assets for project ${work.id}`);
  const titleLang = work.titleLang ? ` lang="${escapeHtml(work.titleLang)}"` : "";
  const title = work.title.map((line, index) => index === 0 ? escapeHtml(line) : `<span class="projects-title-subline">${escapeHtml(line)}</span>`).join("<br>");
  const overline = `${work.overline}${work.code ? ` / ${work.code}` : ""}`;
  const playerAria = `${labels.players}: ${work.playerCount}${work.playerUnit}`;
  const plainTitle = work.title.join("");
  const stores = [
    { platform: labels.platforms[0], url: work.appStoreUrl, label: work.appStoreLabel },
    { platform: labels.platforms[1], url: work.storeUrl, label: work.storeLabel }
  ];
  if (stores.some(store => !store.url || !store.label)) throw new Error(`Missing store link for project ${work.id}`);
  return `<section id="project-${work.id}" class="projects-showcase projects-${work.id}" aria-labelledby="project-${work.id}-title">
    <div class="container">
      <div class="projects-section-heading">
        <p class="projects-section-label"><span aria-hidden="true"></span>${escapeHtml(work.category)}</p>
        <p class="projects-section-market">${escapeHtml(work.market)}</p>
      </div>
      <div class="projects-intro">
        <div class="projects-title-lockup">
          ${projectImage(assets.icon, work.iconAlt, "projects-icon")}
          <div><p class="projects-overline">${escapeHtml(overline)}</p><h2 id="project-${work.id}-title"${titleLang}>${title}</h2></div>
        </div>
        <div class="projects-summary">
          <div class="projects-data" role="group" aria-label="${escapeHtml(labels.dataAria)}">
            <dl class="projects-player-stat" aria-label="${escapeHtml(playerAria)}">
              <dt class="projects-data-label">${escapeHtml(labels.players)}</dt>
              <dd class="projects-player-value">${escapeHtml(work.playerCount)}<em>${escapeHtml(work.playerUnit)}</em></dd>
              <dd class="projects-data-eyebrow" aria-hidden="true">${escapeHtml(labels.playersEyebrow)}</dd>
            </dl>
            <div class="projects-availability">
              <div class="projects-availability-heading"><strong>${escapeHtml(labels.availability)}</strong><small aria-hidden="true">${escapeHtml(labels.availabilityEyebrow)}</small></div>
              <div class="projects-platforms" role="list">${stores.map(store => `<a class="projects-platform projects-store-button" role="listitem" href="${escapeHtml(store.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(`${plainTitle} - ${store.label}`)}"><i aria-hidden="true"></i><strong>${escapeHtml(store.platform[0])}</strong><small>${escapeHtml(store.platform[1])}</small><span aria-hidden="true">↗</span></a>`).join("")}</div>
            </div>
          </div>
          <div class="projects-detail-row projects-detail-row-summary">
            <p>${escapeHtml(work.summary)}</p>
          </div>
        </div>
      </div>
      ${projectGallery(work, assets)}
    </div>
  </section>`;
}

function projectIndex(data) {
  return `<section class="projects-index-section">
    <div class="container projects-index-layout">
      <div class="projects-index-heading">
        <p class="projects-section-label"><span aria-hidden="true"></span>${escapeHtml(data.eyebrow)}</p>
        <h2>${data.title.map(line => escapeHtml(line)).join("<br>")}</h2>
      </div>
      <div class="projects-index-list">${data.items.map((item, index) => `<a href="#project-${item.id}">
        <span class="projects-index-number">${String(index + 1).padStart(2, "0")}</span>
        <strong${item.titleLang ? ` lang="${escapeHtml(item.titleLang)}"` : ""}>${escapeHtml(item.title)}</strong>
        <small>${escapeHtml(item.meta)}</small><span class="projects-index-arrow" aria-hidden="true">↗</span>
      </a>`).join("")}</div>
    </div>
  </section>`;
}

function renderProjects(c, localeKey) {
  return `${projectsHero(c.hero)}
    ${c.works.map(work => projectShowcase(work, c.showcaseLabels)).join("")}
    ${projectIndex(c.index)}
    <section class="projects-closing"><div class="container projects-closing-inner">
      <div><p>${escapeHtml(c.closing.kicker)}</p><h2>${c.closing.title.map(line => escapeHtml(line)).join("<br>")}</h2></div>
      <a class="projects-outline-link" href="${routeFor(localeKey, "work")}">${escapeHtml(c.closing.button)}<span aria-hidden="true">→</span></a>
    </div></section>`;
}

function renderCareers(c, localeKey) {
  return `${pageHero("careers", c.hero, localeKey)}
    <section class="section section-paper careers-who"><div class="container">
      <div class="section-heading">${label(c.who.label)}<h2 class="section-title">${escapeHtml(c.who.title)}</h2></div>
      ${traits(c.who.traits)}
    </div></section>
    ${statement(c.statement)}
    <section class="section section-soft careers-openings"><div class="container">
      <div class="section-heading">${label(c.openings.label)}<h2 class="section-title">${escapeHtml(c.openings.title)}</h2></div>
      ${statusStage({ kicker: c.openings.kicker, statusTitle: c.openings.statusTitle, statusBody: c.openings.statusBody, code: c.openings.code }, "", c.openings.contact)}
    </div></section>
    <section class="section section-paper careers-before"><div class="container">
      <div class="section-heading">${label(c.before.label)}<h2 class="section-title">${escapeHtml(c.before.title)}</h2></div>
      ${paragraphs(c.before.paragraphs)}
      <div class="section-cta">${button(c.before.primary, routeFor(localeKey, "work"))}${button(c.before.secondary, routeFor(localeKey, "culture"), "secondary")}</div>
    </div></section>
    <section class="page-cta careers-closing"><div class="container page-cta-inner">
      <div>${label(c.closing.label)}<h2>${escapeHtml(c.closing.title)}</h2><p>${escapeHtml(c.closing.body)}</p></div>
      <div class="cta-actions">${button(c.closing.button, routeFor(localeKey, "home"), "secondary")}</div>
    </div></section>`;
}

function renderMain(pageKey, page, localeKey) {
  if (pageKey === "home") return renderHome(page, localeKey);
  if (pageKey === "about") return renderAbout(page, localeKey);
  if (pageKey === "work") return renderWork(page, localeKey);
  if (pageKey === "culture") return renderCulture(page, localeKey);
  if (pageKey === "projects") return renderProjects(page, localeKey);
  return renderCareers(page, localeKey);
}

function header(localeKey, pageKey, locale) {
  const g = locale.global;
  return `<header class="site-header">
    <div class="header-inner">
      <a class="brand-link" href="${routeFor(localeKey, "home")}" aria-label="${escapeHtml(g.brandHome)}">
        <img src="/assets/logo-primary.svg" alt="ONEPIECE STUDIO" width="1180" height="360">
      </a>
      <button class="menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="site-menu" aria-label="${escapeHtml(g.openMenu)}" data-open-label="${escapeHtml(g.openMenu)}" data-close-label="${escapeHtml(g.closeMenu)}">
        <span class="menu-icon" aria-hidden="true"></span>
      </button>
      <div id="site-menu" class="header-panel" data-menu-panel>
        <nav aria-label="${escapeHtml(g.mainNav)}">
          <ul class="nav-list">${PAGE_KEYS.map(key => `<li><a class="nav-link" href="${routeFor(localeKey, key)}"${key === pageKey ? ' aria-current="page"' : ""}>${escapeHtml(g.nav[key])}</a></li>`).join("")}</ul>
        </nav>
        <nav class="language-switch" aria-label="${escapeHtml(g.languageNav)}">
          ${Object.keys(locales).map(key => `<a href="${routeFor(key, pageKey)}" hreflang="${locales[key].lang}" lang="${locales[key].lang}"${key === localeKey ? ' aria-current="true"' : ""}>${escapeHtml(g.languages[key])}</a>`).join("")}
        </nav>
      </div>
    </div>
  </header>`;
}

function footer(localeKey, locale) {
  const g = locale.global;
  return `<footer class="site-footer">
    <div class="container">
      <div class="footer-top">
        <div>
          <img class="footer-logo" src="/assets/logo-reverse.svg" alt="ONEPIECE STUDIO" width="1180" height="360">
          <p class="footer-company">${escapeHtml(g.legalName)}</p>
          <div class="footer-details">
            <div><span class="footer-detail-label">${escapeHtml(g.addressLabel)}</span>${escapeHtml(g.address)}</div>
            <div><span class="footer-detail-label">${escapeHtml(g.contactLabel)}</span><span class="footer-contact-placeholder">${escapeHtml(g.contactPlaceholder)}</span></div>
          </div>
        </div>
        <nav class="footer-nav" aria-label="${escapeHtml(g.footerNav)}">
          ${PAGE_KEYS.map(key => `<a href="${routeFor(localeKey, key)}">${escapeHtml(g.nav[key])}</a>`).join("")}
        </nav>
      </div>
      <div class="footer-bottom">
        <span>© <span data-current-year>2026</span> ONEPIECE STUDIO</span>
        <span>${escapeHtml(g.geo)}</span>
      </div>
    </div>
  </footer>`;
}

const organizationJson = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ONEPIECE STUDIO",
  legalName: "旺皮斯网络科技（成都）有限责任公司",
  url: siteUrl,
  logo: `${siteUrl}/assets/logo-primary.svg`,
  foundingDate: "2024-04",
  numberOfEmployees: {
    "@type": "QuantitativeValue",
    value: 50
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: "天府软件园D区D6 1601",
    addressLocality: "成都",
    addressRegion: "四川省",
    addressCountry: "CN"
  }
});

function documentHtml(localeKey, pageKey, locale, page) {
  const route = routeFor(localeKey, pageKey);
  const canonical = `${siteUrl}${route}`;
  const alternates = Object.entries(locales).map(([key, target]) => `<link rel="alternate" hreflang="${target.lang}" href="${siteUrl}${routeFor(key, pageKey)}">`).join("\n  ");
  const ogAlternates = Object.entries(locales).filter(([key]) => key !== localeKey).map(([, target]) => `<meta property="og:locale:alternate" content="${target.ogLocale}">`).join("\n  ");
  const corePageStyles = ["about", "work", "culture"].includes(pageKey)
    ? `\n  <link rel="stylesheet" href="/assets/core-pages.css?v=${assetVersion}">`
    : "";

  return `<!doctype html>
<html lang="${locale.lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#F6F7F4">
  <meta name="color-scheme" content="light">
${githubPages ? "" : `  <meta name="google-site-verification" content="${googleSiteVerification}">\n`}  <meta name="description" content="${escapeHtml(page.metaDescription)}">
  <meta name="robots" content="${githubPages ? "noindex,follow" : "index,follow,max-image-preview:large"}">
  <title>${escapeHtml(page.metaTitle)}</title>
  <link rel="canonical" href="${canonical}">
  ${alternates}
  <link rel="alternate" hreflang="x-default" href="${siteUrl}${routeFor("zh", pageKey)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="ONEPIECE STUDIO">
  <meta property="og:title" content="${escapeHtml(page.metaTitle)}">
  <meta property="og:description" content="${escapeHtml(page.metaDescription)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${siteUrl}/assets/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="${locale.ogLocale}">
  ${ogAlternates}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(page.metaTitle)}">
  <meta name="twitter:description" content="${escapeHtml(page.metaDescription)}">
  <meta name="twitter:image" content="${siteUrl}/assets/og-image.png">
  <link rel="icon" href="/assets/favicon.ico" sizes="any">
  <link rel="icon" href="/assets/icon-32.png" type="image/png" sizes="32x32">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <script src="/assets/motion-preflight.js?v=${assetVersion}"></script>
  <link rel="stylesheet" href="/assets/styles.css?v=${assetVersion}">${corePageStyles}
  <link rel="stylesheet" href="/assets/motion.css?v=${assetVersion}">
  <script src="/assets/site.js?v=${assetVersion}" defer></script>
  <script src="/assets/motion.js?v=${assetVersion}" defer></script>
  <script type="application/ld+json">${organizationJson}</script>
</head>
<body data-page="${pageKey}" data-locale="${localeKey}">
  <a class="skip-link" href="#main">${escapeHtml(locale.global.skip)}</a>
  ${header(localeKey, pageKey, locale)}
  <main id="main">${renderMain(pageKey, page, localeKey)}</main>
  ${footer(localeKey, locale)}
</body>
</html>`;
}

const notFound = {
  zh: { title: "页面未找到", body: "你访问的页面不存在或已经移动。", button: "返回首页" },
  ja: { title: "ページが見つかりません", body: "お探しのページは存在しないか、移動した可能性があります。", button: "ホームへ戻る" },
  en: { title: "Page not found", body: "The page you are looking for does not exist or may have moved.", button: "Back to Home" }
};

function notFoundHtml(localeKey, locale) {
  const copy = notFound[localeKey];
  return `<!doctype html><html lang="${locale.lang}"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,follow"><meta name="theme-color" content="#F6F7F4">
  <title>404 | ONEPIECE STUDIO</title>
  <link rel="icon" href="/assets/favicon.ico" sizes="any"><link rel="stylesheet" href="/assets/styles.css?v=${assetVersion}"><script src="/assets/site.js?v=${assetVersion}" defer></script>
</head><body data-page="404" data-locale="${localeKey}">
  <a class="skip-link" href="#main">${escapeHtml(locale.global.skip)}</a>${header(localeKey, "home", locale)}
  <main id="main"><section class="not-found"><div class="container"><p class="eyebrow">404 / NOT FOUND</p><h1>${escapeHtml(copy.title)}</h1><p>${escapeHtml(copy.body)}</p>${button(copy.button, routeFor(localeKey, "home"))}</div></section></main>
  ${footer(localeKey, locale)}</body></html>`;
}

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });
mkdirSync(path.join(distDir, "assets"), { recursive: true });
writeFileSync(path.join(distDir, ".nojekyll"), "", "utf8");

for (const asset of readdirSync(path.join(srcDir, "assets"), { withFileTypes: true })) {
  if (!asset.isFile()) continue;
  copyFileSync(path.join(srcDir, "assets", asset.name), path.join(distDir, "assets", asset.name));
}
copyFileSync(path.join(srcDir, "styles.css"), path.join(distDir, "assets", "styles.css"));
copyFileSync(path.join(srcDir, "core-pages.css"), path.join(distDir, "assets", "core-pages.css"));
copyFileSync(path.join(srcDir, "site.js"), path.join(distDir, "assets", "site.js"));
copyFileSync(path.join(srcDir, "motion-preflight.js"), path.join(distDir, "assets", "motion-preflight.js"));
copyFileSync(path.join(srcDir, "motion.css"), path.join(distDir, "assets", "motion.css"));
copyFileSync(path.join(srcDir, "motion.js"), path.join(distDir, "assets", "motion.js"));

if (!existsSync(path.join(distDir, "assets", "og-image.png"))) {
  throw new Error("Missing src/assets/og-image.png. Generate the social image before building.");
}

for (const [localeKey, locale] of Object.entries(locales)) {
  for (const pageKey of PAGE_KEYS) {
    const output = outputFor(localeKey, pageKey);
    mkdirSync(path.dirname(output), { recursive: true });
    writeFileSync(output, documentHtml(localeKey, pageKey, locale, locale.pages[pageKey]), "utf8");
  }

  const locale404 = localeKey === "zh" ? path.join(distDir, "404.html") : path.join(distDir, localeKey, "404.html");
  mkdirSync(path.dirname(locale404), { recursive: true });
  writeFileSync(locale404, notFoundHtml(localeKey, locale), "utf8");
}

const manifest = {
  name: "ONEPIECE STUDIO",
  short_name: "ONEPIECE",
  start_url: "/",
  display: "standalone",
  background_color: "#F6F7F4",
  theme_color: "#465E73",
  icons: [
    { src: "/assets/icon-32.png", sizes: "32x32", type: "image/png" },
    { src: "/assets/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
  ]
};
writeFileSync(path.join(distDir, "site.webmanifest"), JSON.stringify(manifest, null, 2), "utf8");

const sitemapUrls = Object.keys(locales).flatMap(localeKey => PAGE_KEYS.map(pageKey => `${siteUrl}${routeFor(localeKey, pageKey)}`));
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.map(url => `  <url><loc>${url}</loc><lastmod>${buildDate}</lastmod></url>`).join("\n")}\n</urlset>\n`;
writeFileSync(path.join(distDir, "sitemap.xml"), sitemap, "utf8");
writeFileSync(path.join(distDir, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`, "utf8");

const jsonHash = createHash("sha256").update(organizationJson).digest("base64");
const headers = `/*
  Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self' 'sha256-${jsonHash}'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()

/assets/*
  Cache-Control: public, max-age=604800

/*.html
  Cache-Control: public, max-age=0, must-revalidate
`;
writeFileSync(path.join(distDir, "_headers"), headers, "utf8");

const redirects = `/homepage.html / 301\n/zh / 301\n/zh/ / 301\n/zh/:splat /:splat 301\n`;
writeFileSync(path.join(distDir, "_redirects"), redirects, "utf8");

const generated = Object.keys(locales).length * PAGE_KEYS.length;
console.log(`Built ${generated} localized pages and 3 localized 404 pages for ${siteUrl}`);
