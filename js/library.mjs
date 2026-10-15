/* =====================================================================
   Library Page Module
   Shows the saved books and lets the reader filter them by status,
   category and rating, sort them, and search by title or author. The
   chosen filters are saved in localStorage, so they are still there the
   next time the page opens.

   Events used on this page:
     1. click   status buttons
     2. change  category, rating and sort menus
     3. input   live search inside the library
     4. click   "Reset Filters" button
   ===================================================================== */
import { getLibrary, getFilters, setFilters } from "./storage.mjs";
import { defaultFilters, filterBooks, sortBooks } from "./filters.mjs";
import { renderStatusList, renderCategoryOptions, renderLibraryGrid } from "./ui.mjs";

const STATUSES = ["all", "want", "reading", "finished"];

export function initLibrary() {
  const els = {
    statusList: document.querySelector("#status-list"),
    category: document.querySelector("#filter-category"),
    rating: document.querySelector("#filter-rating"),
    sort: document.querySelector("#sort-by"),
    search: document.querySelector("#library-search"),
    grid: document.querySelector("#library-grid"),
    count: document.querySelector("#library-count"),
  };

  // Load previously saved filters
  let filters = { ...defaultFilters, ...(getFilters() || {}) };

  // Check whether the URL specifies a reading status
  const urlStatus = new URLSearchParams(location.search).get("status");

  // A valid URL status takes priority.
  // Without one, show books from all statuses.
  filters.status = STATUSES.includes(urlStatus) ? urlStatus : "all";


  // Redraws only the list of books and the counter (used while typing)
  function renderList() {
    const library = getLibrary();
    const visible = sortBooks(filterBooks(library, filters), filters.sort);

    renderLibraryGrid(els.grid, visible, library.length === 0);
    els.count.textContent = library.length ? `Showing ${visible.length} of ${library.length} books` : "";
    setFilters(filters);
  }

  // Redraws everything, including the sidebar and the state of the controls
  function render() {
    const library = getLibrary();
    const counts = {
      all: library.length,
      want: library.filter((b) => b.status === "want").length,
      reading: library.filter((b) => b.status === "reading").length,
      finished: library.filter((b) => b.status === "finished").length,
    };

    renderStatusList(els.statusList, counts, filters.status);
    renderCategoryOptions(els.category, library, filters.category);
    els.rating.value = filters.rating;
    els.sort.value = filters.sort;
    els.search.value = filters.query;
    renderList();
  }

  // 1. click: status buttons (event delegation)
  els.statusList.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-status]");
    if (!btn) return;
    filters.status = btn.dataset.status;
    render();
  });

  // 2. change: the three drop-down menus
  els.category.addEventListener("change", () => { filters.category = els.category.value; render(); });
  els.rating.addEventListener("change", () => { filters.rating = els.rating.value; render(); });
  els.sort.addEventListener("change", () => { filters.sort = els.sort.value; render(); });

  // 3. input: results update on every keystroke
  els.search.addEventListener("input", () => {
    filters.query = els.search.value;
    renderList();
  });

  // 4. click: back to the default filters
  document.querySelector("#reset-filters").addEventListener("click", () => {
    filters = { ...defaultFilters };
    render();
  });

  render();
}
