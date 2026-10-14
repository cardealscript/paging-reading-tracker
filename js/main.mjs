/* =====================================================================
   Main Module (entry point)
   Every HTML page loads this file. The attribute <body data-page="...">
   tells it which page is open, and only that page's code runs. This keeps
   one JavaScript structure for the whole website:

     layout.mjs       header, footer and navigation (all pages)
     events.mjs       mobile menu and reset dialog (all pages)
     home.mjs         Home page          library.mjs    My Library page
     details.mjs      Book Details page  stats-page.mjs Statistics page
   ===================================================================== */
import { renderLayout } from "./layout.mjs";
import { initGlobalEvents } from "./events.mjs";
import { initHome } from "./home.mjs";
import { initLibrary } from "./library.mjs";
import { initDetails } from "./details.mjs";
import { initStatsPage } from "./stats-page.mjs";

// Page name (from data-page) -> function that starts that page
const pages = { home: initHome, library: initLibrary, details: initDetails, stats: initStatsPage };

document.addEventListener("DOMContentLoaded", () => {
  renderLayout(document.body.dataset.nav); // shared parts first
  initGlobalEvents();
  pages[document.body.dataset.page]?.(); // the 404 page has no function, so nothing extra runs
  console.log("Paging ready");
});
