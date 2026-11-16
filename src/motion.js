(() => {
  const root = document.documentElement;
  const header = document.querySelector(".site-header");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const clearPreflight = () => {
    window.clearTimeout(window.__motionFallback);
    root.classList.remove("motion-preflight");
  };
  const canAnimate = typeof window.IntersectionObserver === "function" && !reduceMotion.matches;

  if (header) {
    header.classList.add("motion-header");
    const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  if (!canAnimate) {
    clearPreflight();
    root.classList.add("motion-disabled");
    reduceMotion.addEventListener?.("change", event => {
      if (!event.matches) window.location.reload();
    });
    return;
  }

  let motionActive = true;
  const settleTimers = [];

  const progress = document.createElement("div");
  progress.className = "motion-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.append(progress);

  let progressFrame = 0;
  const updateProgress = () => {
    progressFrame = 0;
    if (!motionActive) return;
    const available = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = available > 0 ? Math.min(1, Math.max(0, window.scrollY / available)) : 0;
    progress.style.transform = `scaleX(${ratio})`;
  };
  const requestProgressUpdate = () => {
    if (motionActive && !progressFrame) progressFrame = requestAnimationFrame(updateProgress);
  };

  window.addEventListener("scroll", requestProgressUpdate, { passive: true });
  window.addEventListener("resize", requestProgressUpdate, { passive: true });
  updateProgress();

  const heroCopy = document.querySelector(".home-hero-copy, .projects-hero-copy, .page-hero-copy");
  const heroMarks = [...document.querySelectorAll(".hero-mark-wrap, .projects-hero-index, .page-hero-number, .page-hero-mark, .studio-hero-index, .studio-hero-mark")];

  if (heroCopy) {
    heroCopy.classList.add("motion-hero-copy");
    [...heroCopy.children].forEach((element, index) => element.style.setProperty("--motion-order", String(index)));
  }
  heroMarks.forEach(element => {
    element.classList.add("motion-hero-mark");
    const opacity = element.matches(".studio-hero-mark")
      ? "0.055"
      : element.matches(".page-hero-mark")
      ? (element.closest(".page-hero-blue") ? "0.10" : "0.08")
      : "1";
    element.style.setProperty("--motion-end-opacity", opacity);
  });

  const revealElements = new Set();
  const orderedGroups = [
    ".facts-grid",
    ".projects-facts",
    ".value-grid",
    ".inner-facts-grid",
    ".principle-strip",
    ".editorial-columns",
    ".project-evidence-grid",
    ".focus-list-enhanced",
    ".process-track",
    ".market-lens-grid",
    ".discipline-track",
    ".culture-value-grid",
    ".practice-track",
    ".culture-proof-strip",
    ".trait-grid",
    ".direction-track",
    ".compact-profile",
    ".hero-facts",
    ".dossier-list",
    ".discipline-strip",
    ".capability-track",
    ".quality-lines",
    ".proof-band",
    ".value-list",
    ".behavior-list"
  ];

  document.querySelectorAll(orderedGroups.join(",")).forEach(group => {
    [...group.children].forEach((element, index) => {
      element.classList.add("motion-fact");
      element.style.setProperty("--motion-order", String(index));
      revealElements.add(element);
    });
  });

  const revealSelectors = [
    ".section-heading",
    ".section-copy",
    ".lined-list",
    ".section-cta",
    ".status-stage",
    ".page-cta-inner",
    ".projects-section-heading",
    ".projects-title-lockup",
    ".projects-data",
    ".projects-detail-row",
    ".projects-index-heading",
    ".projects-index-list",
    ".projects-closing-inner",
    ".evidence-heading",
    ".market-lens-lead",
    ".practice-lede",
    ".statement-copy",
    ".text-link",
    ".mission-copy",
    ".dossier-grid",
    ".discipline-intro",
    ".market-layout",
    ".behavior-intro",
    ".culture-close"
  ];

  document.querySelectorAll(revealSelectors.join(",")).forEach(element => {
    element.classList.add("motion-reveal");
    revealElements.add(element);
  });

  document.querySelectorAll(".process-track, .practice-track, .direction-track").forEach(element => {
    element.classList.add("motion-sequence");
    revealElements.add(element);
  });

  document.querySelectorAll(".location-panel").forEach(element => {
    element.classList.add("motion-panel");
    revealElements.add(element);
  });

  document.querySelectorAll(".statement-mark, .market-lens-mark").forEach(element => {
    element.classList.add("motion-decor");
    element.style.setProperty("--motion-end-opacity", element.matches(".statement-mark") ? "0.10" : "0.08");
    revealElements.add(element);
  });

  document.querySelectorAll(".project-evidence-item, .culture-proof-strip figure, .culture-gallery figure").forEach(element => {
    element.classList.add("motion-media-item");
  });

  document.querySelectorAll(".projects-gallery, .culture-gallery").forEach(gallery => {
    gallery.classList.add("motion-gallery");
    [...gallery.querySelectorAll("figure")].forEach((figure, index) => {
      figure.classList.add("motion-gallery-item");
      figure.style.setProperty("--motion-order", String(index));
    });
    revealElements.add(gallery);
  });

  const counters = [...document.querySelectorAll(".projects-player-value")].map(element => {
    const textNode = [...element.childNodes].find(node => node.nodeType === Node.TEXT_NODE);
    const raw = textNode?.nodeValue?.trim() || "0";
    const target = Number.parseFloat(raw);
    const decimals = raw.includes(".") ? raw.split(".")[1].length : 0;
    return { element, textNode, target, decimals, played: false, frame: 0 };
  });

  const playCounter = counter => {
    if (!motionActive || counter.played || !counter.textNode || !Number.isFinite(counter.target)) return;
    counter.played = true;
    const started = performance.now();
    const duration = 760;

    const frame = now => {
      if (!motionActive) return;
      const progressValue = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progressValue, 3);
      const value = counter.target * eased;
      counter.textNode.nodeValue = counter.decimals ? value.toFixed(counter.decimals) : String(Math.round(value));
      if (progressValue < 1) counter.frame = requestAnimationFrame(frame);
      else {
        counter.frame = 0;
        counter.textNode.nodeValue = counter.target.toFixed(counter.decimals);
      }
    };

    counter.frame = requestAnimationFrame(frame);
  };

  let observer;
  const revealElement = element => {
    if (element.classList.contains("is-visible")) return;
    element.classList.add("is-visible");
    observer?.unobserve(element);

    if (element.classList.contains("motion-gallery")) {
      settleTimers.push(window.setTimeout(() => element.classList.add("is-settled"), 1150));
    }

    counters.forEach(counter => {
      if (element === counter.element || element.contains(counter.element)) playCounter(counter);
    });
  };

  observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) revealElement(entry.target);
    }
  }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });

  revealElements.forEach(element => observer.observe(element));

  let revealTimer = 0;
  const revealVisibleElements = () => {
    revealTimer = 0;
    if (!motionActive) return;
    revealElements.forEach(element => {
      if (element.classList.contains("is-visible")) return;
      const rect = element.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.98 && rect.bottom >= 0) revealElement(element);
    });
  };
  const requestRevealCheck = () => {
    if (motionActive && !revealTimer) revealTimer = window.setTimeout(revealVisibleElements, 16);
  };
  window.addEventListener("scroll", requestRevealCheck, { passive: true });
  window.addEventListener("resize", requestRevealCheck, { passive: true });
  requestRevealCheck();

  const disableMotion = () => {
    if (!motionActive) return;
    motionActive = false;
    observer.disconnect();
    if (progressFrame) cancelAnimationFrame(progressFrame);
    if (revealTimer) clearTimeout(revealTimer);
    settleTimers.forEach(timer => clearTimeout(timer));
    counters.forEach(counter => {
      if (counter.frame) cancelAnimationFrame(counter.frame);
      if (counter.textNode && Number.isFinite(counter.target)) counter.textNode.nodeValue = counter.target.toFixed(counter.decimals);
      counter.played = true;
      counter.frame = 0;
    });
    revealElements.forEach(element => element.classList.add("is-visible"));
    document.querySelectorAll(".motion-gallery").forEach(gallery => gallery.classList.add("is-visible", "is-settled"));
    heroCopy?.classList.add("is-visible");
    heroMarks.forEach(element => element.classList.add("is-visible"));
    progress.remove();
    root.classList.remove("motion-ready", "motion-preflight");
    root.classList.add("motion-disabled");
    window.removeEventListener("scroll", requestProgressUpdate);
    window.removeEventListener("resize", requestProgressUpdate);
    window.removeEventListener("scroll", requestRevealCheck);
    window.removeEventListener("resize", requestRevealCheck);
  };

  reduceMotion.addEventListener?.("change", event => {
    if (event.matches) disableMotion();
    else window.location.reload();
  });

  root.classList.add("motion-ready");
  clearPreflight();
  const showHero = () => {
    if (!motionActive) return;
    heroCopy?.classList.add("is-visible");
    heroMarks.forEach(element => element.classList.add("is-visible"));
  };
  settleTimers.push(window.setTimeout(showHero, 120));
  requestAnimationFrame(() => requestAnimationFrame(() => {
    showHero();
  }));
})();
