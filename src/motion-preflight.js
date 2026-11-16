(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (typeof window.IntersectionObserver !== "function" || reduceMotion.matches) return;

  const root = document.documentElement;
  root.classList.add("motion-preflight");
  window.__motionFallback = window.setTimeout(() => root.classList.remove("motion-preflight"), 2000);
})();
