const root = document.documentElement;
const body = document.body;
const menuButton = document.querySelector("[data-menu-toggle]");
const menuPanel = document.querySelector("[data-menu-panel]");
const desktopQuery = window.matchMedia("(min-width: 981px)");
const pageRegions = [...document.querySelectorAll("main, footer")];

root.classList.add("js");

function closeMenu({ returnFocus = false } = {}) {
  if (!menuButton || !menuPanel) return;
  body.classList.remove("menu-open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", menuButton.dataset.openLabel);
  pageRegions.forEach(region => region.removeAttribute("inert"));
  if (returnFocus) menuButton.focus();
}

if (menuButton && menuPanel) {
  menuButton.addEventListener("click", () => {
    const opening = !body.classList.contains("menu-open");
    body.classList.toggle("menu-open", opening);
    menuButton.setAttribute("aria-expanded", String(opening));
    menuButton.setAttribute("aria-label", opening ? menuButton.dataset.closeLabel : menuButton.dataset.openLabel);
    pageRegions.forEach(region => region.toggleAttribute("inert", opening));
  });

  menuPanel.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => closeMenu());
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Tab" && body.classList.contains("menu-open")) {
      const focusable = [menuButton, ...menuPanel.querySelectorAll("a, button, [tabindex]:not([tabindex='-1'])")]
        .filter(element => !element.hasAttribute("disabled"));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    if (event.key === "Escape" && body.classList.contains("menu-open")) {
      closeMenu({ returnFocus: true });
    }
  });

  desktopQuery.addEventListener("change", event => {
    if (event.matches) closeMenu();
  });
}

document.querySelectorAll("[data-current-year]").forEach(node => {
  node.textContent = String(new Date().getFullYear());
});
