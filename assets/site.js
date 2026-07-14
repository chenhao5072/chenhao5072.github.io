const root = document.documentElement;
const body = document.body;
const menuButton = document.querySelector("[data-menu-toggle]");
const menuPanel = document.querySelector("[data-menu-panel]");
const desktopQuery = window.matchMedia("(min-width: 981px)");

root.classList.add("js");

function closeMenu({ returnFocus = false } = {}) {
  if (!menuButton || !menuPanel) return;
  body.classList.remove("menu-open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", menuButton.dataset.openLabel);
  if (returnFocus) menuButton.focus();
}

if (menuButton && menuPanel) {
  menuButton.addEventListener("click", () => {
    const opening = !body.classList.contains("menu-open");
    body.classList.toggle("menu-open", opening);
    menuButton.setAttribute("aria-expanded", String(opening));
    menuButton.setAttribute("aria-label", opening ? menuButton.dataset.closeLabel : menuButton.dataset.openLabel);
  });

  menuPanel.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => closeMenu());
  });

  document.addEventListener("keydown", event => {
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
