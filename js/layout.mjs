/* =====================================================================
   Layout Module
   The header, bottom navigation, footer and the Reset Data dialog are
   the same on every page, so they are written once here and inserted by
   JavaScript. This avoids repeating the same HTML in five files and
   guarantees that the navigation always matches. The active page is
   highlighted using the value of <body data-nav="...">.
   ===================================================================== */
import { icons } from "./icons.mjs";

// Navigation items, used for both the header and the mobile bottom bar
const NAV = [
  { id: "home", label: "Home", href: "index.html", icon: icons.home },
  { id: "search", label: "Search", href: "index.html#search", icon: icons.search },
  { id: "library", label: "My Library", href: "library.html", icon: icons.library },
  { id: "stats", label: "Stats", href: "stats.html", icon: icons.chart },
];

// Date the file was last changed, formatted for the footer
function lastModified() {
  const date = new Date(document.lastModified);
  return date.toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" });
}

export function renderLayout(active) {
  const isActive = (id) => id === active;

  // Desktop links (the "Search" item only exists in the mobile bar and the header icon)
  const mainLinks = NAV.filter((n) => n.id !== "search")
    .map((n) => `<a href="${n.href}" class="${isActive(n.id) ? "active" : ""}"${isActive(n.id) ? ' aria-current="page"' : ""}>${n.label}</a>`)
    .join("");

  document.querySelector("#site-header").innerHTML = `
    <a class="brand" href="index.html"><img src="images/logo.svg" alt="" width="34" height="34"><span>PAGING</span></a>
    <nav class="main-nav" id="main-nav" aria-label="Main">${mainLinks}</nav>
    <div class="header-actions">
      <a class="icon-btn" href="index.html#search" aria-label="Search books">${icons.search}</a>
      <span class="avatar" aria-hidden="true">${icons.user}</span>
      <button type="button" class="icon-btn menu-btn" id="menu-btn" aria-expanded="false" aria-controls="main-nav" aria-label="Open menu">${icons.menu}</button>
    </div>`;

  const bottom = NAV.map((n) => `<a href="${n.href}" class="${isActive(n.id) ? "active" : ""}">${n.icon}<span>${n.label}</span></a>`).join("");

  // Footer with copyright, last modified date and data credits,
  // then the mobile bottom bar and the native <dialog> used to confirm a reset
  document.body.insertAdjacentHTML("beforeend", `
    <footer class="site-footer">
      <p><strong>PAGING</strong><span>One Page at a Time.</span></p>
      <p><span>© ${new Date().getFullYear()} Cardeal Felisberto · WDD 330 · BYU-Idaho</span></p>
      <p><span>Last modified: ${lastModified()}</span></p>
      <p><span>Book data: Open Library and Google Books · Photos: Unsplash</span></p>
    </footer>
    <nav class="bottom-nav" aria-label="Mobile">${bottom}</nav>
    <dialog id="reset-dialog" aria-labelledby="reset-title">
      <span class="dialog-icon">${icons.alert}</span>
      <h2 id="reset-title">Reset Reading Data</h2>
      <p>This will permanently delete all your saved books, progress, ratings and notes from your browser's local storage.</p>
      <p><strong>This action cannot be undone.</strong></p>
      <div class="dialog-actions">
        <button type="button" class="btn btn-outline" data-cancel-reset>Cancel</button>
        <button type="button" class="btn btn-primary" data-confirm-reset>Reset Data</button>
      </div>
    </dialog>`);
}
