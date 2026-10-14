/* =====================================================================
   Home Page Module
   Controls the dashboard: time-based greeting, book search, search
   results, statistics cards, Currently Reading, Recently Added, the
   Random Book Picker and the quote slider.

   Events used on this page:
     1. submit   search form
     2. click    quick-search chips
     3. click    result cards (flip, or open the details page)
     4. keydown  keyboard access to the flip cards
     5. click    "Clear results" button
     6. click    Random Book Picker
   ===================================================================== */
import { initQuoteSlider } from "./quotes.mjs";
import { searchBooks } from "./api.mjs";
import { getLibrary, getLastSearch, setLastSearch, setCurrentBook } from "./storage.mjs";
import { calculateStats, pickRandomBook } from "./stats.mjs";
import { renderResults, renderStatus, renderStatCards, renderCurrentlyReading, renderRecentlyAdded, escapeHTML } from "./ui.mjs";
import { showLoader, toggleFlip, staggerItems } from "./animations.mjs";

let results = []; // books returned by the latest search

// The greeting changes with the time of day on the reader's device
function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning," : hour < 18 ? "Good afternoon," : "Good evening,";
}

// Everything that depends on the saved library
function renderDashboard() {
  const library = getLibrary();
  renderStatCards(document.querySelector("#stat-cards"), calculateStats(library));
  renderCurrentlyReading(document.querySelector("#currently-reading"), library.filter((b) => b.status === "reading").slice(0, 4));
  renderRecentlyAdded(document.querySelector("#recent"), library);
}

// Searches Open Library and shows the results, with loading and error states
async function runSearch(query, els) {
  const term = query.trim();
  if (term.length < 2) return;

  setLastSearch(term); // localStorage: remembered for the next visit
  els.section.hidden = false;
  els.results.innerHTML = "";
  showLoader(els.status, `Searching for “${term}”…`);
  els.section.scrollIntoView({ behavior: "smooth", block: "start" });

  try {
    results = await searchBooks(term);
    if (!results.length) return renderStatus(els.status, `No books found for “${term}”. Try another title or author.`);

    renderStatus(els.status, `${results.length} books found. Hover or tap a cover to flip it.`);
    renderResults(els.results, results);
    staggerItems(els.results);
  } catch (error) {
    console.error(error);
    renderStatus(els.status, "Could not load books. Check your connection and try again.", true);
  }
}

export function initHome() {
  const els = {
    greeting: document.querySelector("#greeting"),
    form: document.querySelector("#search-form"),
    input: document.querySelector("#search-input"),
    section: document.querySelector("#results-section"),
    status: document.querySelector("#status"),
    results: document.querySelector("#results"),
  };

  els.greeting.textContent = greeting();
  els.input.value = getLastSearch(); // the previous search term is shown again
  renderDashboard();
  initQuoteSlider();
  if (location.hash === "#search") els.input.focus(); // arriving from a "Search" link

  // 1. submit: search form
  els.form.addEventListener("submit", (e) => {
    e.preventDefault(); // stay on the page instead of reloading it
    runSearch(els.input.value, els);
  });

  // 2. click: quick-search chips fill the field and search at once
  document.querySelector(".chips").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    els.input.value = chip.dataset.query;
    runSearch(chip.dataset.query, els);
  });

  // 3. click (event delegation): one listener serves every result card.
  // The details link saves the chosen book first, so the next page opens instantly.
  els.results.addEventListener("click", (e) => {
    const link = e.target.closest(".details-link");
    if (link) return setCurrentBook(results[Number(link.dataset.index)]);

    const card = e.target.closest(".book-card");
    if (card) toggleFlip(card);
  });

  // 4. keydown: Enter or Space flips the focused card (keyboard accessibility)
  els.results.addEventListener("keydown", (e) => {
    const card = e.target.closest(".book-card");
    if (card && e.target === card && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      toggleFlip(card);
    }
  });

  // 5. click: hide the results and return to the search field
  document.querySelector("#clear-results").addEventListener("click", () => {
    els.section.hidden = true;
    els.results.innerHTML = "";
    els.input.focus();
  });

  // 6. click: Random Book Picker suggests the next book to read
  document.querySelector("#pick-book").addEventListener("click", () => {
    const out = document.querySelector("#picker-result");
    const book = pickRandomBook(getLibrary());
    out.innerHTML = book
      ? `Read next: <a href="details.html?id=${encodeURIComponent(book.id)}">${escapeHTML(book.title)}</a>`
      : "Add some books to your library first.";
  });
}
