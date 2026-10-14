/* =====================================================================
   UI Module
   Builds the HTML for every part of the interface from JavaScript data
   using template literals. Each render function receives a container
   and the data to show, so the pages stay small and the markup lives
   in one place. All text that comes from an API goes through
   escapeHTML() so it can never inject code into the page.
   ===================================================================== */
import { icons } from "./icons.mjs";
import { bookProgress } from "./stats.mjs";

export const STATUS_LABELS = { want: "Want to Read", reading: "Reading", finished: "Finished" };

// Converts special characters so API text is displayed as text, never as HTML
export function escapeHTML(text = "") {
  return String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Writes a message in a status area; errors get a different style
export function renderStatus(el, message, isError = false) {
  el.classList.toggle("error", isError);
  el.textContent = message;
}

/* ---------- Small building blocks used by several pages ---------- */
const authorsText = (book) => book.authors.join(", ") || "Unknown author";
const tags = (list, max = 3) => list.slice(0, max).map((s) => `<span class="tag">${escapeHTML(s)}</span>`).join("");
const stars = (value) => `<span class="stars" aria-label="${value} out of 5 stars">${"★".repeat(value)}${"☆".repeat(5 - value)}</span>`;
const progressBar = (p) => `<div class="progress" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100"><span style="width:${p}%"></span></div>`;
const statusTag = (status) => `<span class="tag s-${status}">${STATUS_LABELS[status]}</span>`;

// Cover image, or a text placeholder when the API has no cover for the book
function cover(book, cls = "cover") {
  return book.cover
    ? `<img class="${cls}" src="${escapeHTML(book.cover)}" alt="Cover of ${escapeHTML(book.title)}" loading="lazy">`
    : `<div class="cover-fallback">${escapeHTML(book.title)}</div>`;
}

/* ---------- Home: statistic cards (also used on the Statistics page) ---------- */
export function renderStatCards(container, s) {
  const items = [
    [icons.book, s.total, "Total Books"],
    [icons.bookmark, s.reading, "Currently Reading"],
    [icons.check, s.finished, "Finished Books"],
    [icons.star, s.averageRating ? s.averageRating.toFixed(1) : "—", "Average Rating"],
  ];
  container.innerHTML = items.map(([icon, value, label]) => `
    <div class="card stat-card">
      <span class="stat-icon">${icon}</span>
      <div><span class="stat-value">${value}</span><span class="stat-label">${label}</span></div>
    </div>`).join("");
}

/* ---------- Home: Currently Reading ---------- */
export function renderCurrentlyReading(container, books) {
  if (!books.length) {
    container.innerHTML = `<p class="empty">You are not reading anything yet. Search for a book, add it to your library and set it to “Reading”.</p>`;
    return;
  }

  container.innerHTML = books.map((b) => {
    const p = bookProgress(b);
    return `
    <article class="card reading-card">
      <a href="details.html?id=${encodeURIComponent(b.id)}" aria-label="Open ${escapeHTML(b.title)}">${cover(b)}</a>
      <h3>${escapeHTML(b.title)}</h3>
      <span class="by">${escapeHTML(b.authors[0] || "Unknown author")}</span>
      <div class="progress-line">${progressBar(p)}<span>${p}%</span></div>
      <a class="btn btn-outline" href="details.html?id=${encodeURIComponent(b.id)}">${p ? "Continue Reading" : "Start Reading"}</a>
    </article>`;
  }).join("");
}

/* ---------- Home: Recently Added (the four newest books) ---------- */
export function renderRecentlyAdded(container, library) {
  const recent = [...library].sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, 4);

  container.innerHTML = recent.length
    ? recent.map((b) => `
      <li><a class="recent-item" href="details.html?id=${encodeURIComponent(b.id)}">
        ${cover(b)}
        <div><strong>${escapeHTML(b.title)}</strong><small>${escapeHTML(b.authors[0] || "Unknown author")}</small>${statusTag(b.status)}</div>
      </a></li>`).join("")
    : `<li class="empty">No books yet. Your latest additions will appear here.</li>`;
}

/* ---------- Home: search results as flip cards ----------
   Front: the cover. Back: year, author, categories and a details link.
   The data-index attribute links each card to its book in the results array. */
export function renderResults(container, books) {
  container.innerHTML = books.map((book, i) => `
    <li class="book-item">
      <div class="book-card" data-index="${i}" tabindex="0" role="button" aria-label="Flip card for ${escapeHTML(book.title)}">
        <div class="card-inner">
          <div class="card-face card-front">${cover(book)}</div>
          <div class="card-face card-back">
            <p class="back-year">${book.year || "Year unknown"}${book.pages ? ` · ${book.pages} pages` : ""}</p>
            <p>${escapeHTML(authorsText(book))}</p>
            <div class="back-tags">${tags(book.subjects, 2)}</div>
            <a class="btn btn-primary details-link" data-index="${i}" href="details.html?id=${encodeURIComponent(book.id)}">View details</a>
          </div>
        </div>
      </div>
      <h3 class="book-title">${escapeHTML(book.title)}</h3>
      <p class="book-author">${escapeHTML(book.authors[0] || "Unknown author")}</p>
    </li>`).join("");
}

/* ---------- Library: status buttons with live counters ---------- */
export function renderStatusList(container, counts, active) {
  const items = [["all", "All Books"], ["want", "Want to Read"], ["reading", "Reading"], ["finished", "Finished"]];

  container.innerHTML = items.map(([key, label]) =>
    `<button type="button" class="status-btn${key === active ? " active" : ""}" data-status="${key}" aria-pressed="${key === active}"><span>${label}</span><span>${counts[key]}</span></button>`
  ).join("");
}

// The category menu is built from the categories of the saved books (no duplicates)
export function renderCategoryOptions(select, library, current) {
  const categories = [...new Set(library.flatMap((b) => b.subjects || []))].sort();

  select.innerHTML = `<option value="all">All categories</option>` +
    categories.map((c) => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join("");
  select.value = categories.includes(current) ? current : "all";
}

/* ---------- Library: grid of saved books ---------- */
export function renderLibraryGrid(container, books, libraryIsEmpty) {
  if (!books.length) {
    container.innerHTML = libraryIsEmpty
      ? `<li class="empty">Your library is empty. <a href="index.html#search">Search for a book</a> and add it.</li>`
      : `<li class="empty">No books match these filters. Try “Reset Filters”.</li>`;
    return;
  }

  container.innerHTML = books.map((b) => {
    const p = bookProgress(b);
    return `
    <li><a class="card lib-card" href="details.html?id=${encodeURIComponent(b.id)}">
      ${cover(b)}
      <div>
        <h3>${escapeHTML(b.title)}</h3>
        <p class="by">${escapeHTML(b.authors[0] || "Unknown author")}</p>
        ${statusTag(b.status)}
        ${b.status === "reading" ? progressBar(p) : ""}
        <div class="lib-meta">${b.userRating ? stars(b.userRating) : `<span class="muted">Not rated</span>`}${b.status === "reading" ? `<span>${p}%</span>` : ""}</div>
      </div>
    </a></li>`;
  }).join("");
}

/* ---------- Book details page ----------
   The whole page is drawn from one "state" object (book, saved copy,
   loading flag, active tab, draft note, similar books). When anything
   changes, the state is updated and this function draws the page again. */
export function renderDetailsPage(root, { book, saved, loading, tab, draftNotes, similar }) {
  // "saved" holds the reader's personal data; without it the tracker is disabled
  const user = saved || { status: "want", currentPage: 0, userRating: 0, notes: "" };
  const p = saved ? bookProgress({ ...book, ...saved }) : 0;
  const facts = [
    book.pages && `Pages: ${book.pages}`,
    (book.publishedDate || book.year) && `Published: ${book.publishedDate || book.year}`,
    book.publisher && `Publisher: ${book.publisher}`,
  ].filter(Boolean).join(" · ");
  const row = (label, value) => (value ? `<dt>${label}</dt><dd>${escapeHTML(value)}</dd>` : "");

  // Content of the three tabs
  const panels = {
    description: loading
      ? `<p class="loading-line"><span class="spinner"></span>Loading description…</p>`
      : `<p class="details-desc">${escapeHTML(book.description || "No description available for this book.")}</p>`,
    details: `<dl class="meta-grid">
        ${row("Title", book.title)}${row("Author", authorsText(book))}${row("Pages", book.pages)}
        ${row("Published", book.publishedDate || book.year)}${row("Publisher", book.publisher)}${row("ISBN", book.isbn)}
        ${row("Categories", book.subjects.join(", "))}
        <dt>Links</dt><dd><a href="https://openlibrary.org/works/${escapeHTML(book.id)}" target="_blank" rel="noopener">Open Library</a>${book.previewLink ? ` · <a href="${escapeHTML(book.previewLink)}" target="_blank" rel="noopener">Google Books preview</a>` : ""}</dd>
      </dl>`,
    similar: similar === null
      ? `<p class="loading-line"><span class="spinner"></span>Finding similar books…</p>`
      : similar.length
        ? `<ul class="similar-list">${similar.map((b, i) => `
            <li><a class="recent-item" data-similar="${i}" href="details.html?id=${encodeURIComponent(b.id)}">${cover(b)}<div><strong>${escapeHTML(b.title)}</strong><small>${escapeHTML(b.authors[0] || "Unknown author")}</small></div></a></li>`).join("")}</ul>`
        : `<p class="muted">No similar books found.</p>`,
  };

  const tabButtons = [["description", "Description"], ["details", "Details"], ["similar", "Similar Books"]]
    .map(([key, label]) => `<button type="button" role="tab" class="tab${key === tab ? " active" : ""}" data-action="tab" data-tab="${key}" aria-selected="${key === tab}">${label}</button>`).join("");

  root.innerHTML = `
    <button type="button" class="back-link" data-action="back">← Back</button>
    <div class="details-grid">
      <section class="card">
        <div class="details-top">
          ${book.coverLarge || book.cover ? `<img class="details-cover" src="${escapeHTML(book.coverLarge || book.cover)}" alt="Cover of ${escapeHTML(book.title)}">` : `<div class="cover-fallback">${escapeHTML(book.title)}</div>`}
          <div class="details-head">
            <h1>${escapeHTML(book.title)}</h1>
            <p class="details-author">${escapeHTML(authorsText(book))}</p>
            <p class="api-rating">${book.rating ? `<span class="stars">★</span> <strong>${book.rating}</strong> average rating` : "No public rating yet"}</p>
            <div>${tags(book.subjects, 4)}</div>
            <p class="quick-facts">${escapeHTML(facts)}</p>
            <div class="details-actions">
              ${saved ? `<button type="button" class="btn btn-outline" data-action="remove">Remove from Library</button>` : `<button type="button" class="btn btn-primary" data-action="add">Add to Library</button>`}
              <button type="button" class="btn btn-outline" data-action="share">Share</button>
            </div>
          </div>
        </div>
        <div class="tabs" role="tablist">${tabButtons}</div>
        <div role="tabpanel">${panels[tab]}</div>
      </section>

      <aside class="card progress-panel" aria-label="Your reading progress">
        <h2>Reading Progress</h2>
        <div class="progress-top">${progressBar(p)}<strong>${p}%</strong></div>
        <p class="quick-facts">Page ${user.currentPage} of ${book.pages || "?"}</p>
        <fieldset class="tracker"${saved ? "" : " disabled"}>
          <legend class="visually-hidden">Track this book</legend>
          <div class="page-row">
            <label>Current page <input type="number" id="page-input" min="0"${book.pages ? ` max="${book.pages}"` : ""} value="${user.currentPage}"></label>
            <button type="button" class="btn btn-outline" data-action="update-progress">Update</button>
          </div>
          <label>Status
            <select id="status-select">
              ${Object.entries(STATUS_LABELS).map(([k, v]) => `<option value="${k}"${k === user.status ? " selected" : ""}>${v}</option>`).join("")}
            </select>
          </label>
          <div class="rating-input"><span>Rating</span>
            ${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="star-btn${n <= user.userRating ? " on" : ""}" data-action="rate" data-value="${n}" aria-label="Rate ${n} stars">★</button>`).join("")}
          </div>
          <label>Notes
            <textarea id="notes-input" rows="5" placeholder="Add your notes here...">${escapeHTML(draftNotes ?? user.notes)}</textarea>
          </label>
          <button type="button" class="btn btn-dark" data-action="save-note">Save Note</button>
        </fieldset>
        ${saved ? "" : `<p class="hint">Add this book to your library to track progress, rate it and write notes.</p>`}
      </aside>
    </div>`;
}

/* ---------- Statistics page ---------- */

// Donut chart of books by status; the percentages feed the CSS conic-gradient
export function renderStatusChart(container, s) {
  if (!s.total) {
    container.innerHTML = `<p class="empty">Add books to see your status chart.</p>`;
    return;
  }

  const a = (s.finished / s.total) * 100;
  const b = a + (s.reading / s.total) * 100;
  container.innerHTML = `
    <div class="chart-row">
      <div class="donut" style="--a:${a}%;--b:${b}%" role="img" aria-label="${s.finished} finished, ${s.reading} reading, ${s.want} want to read"><div class="donut-center">${s.total}</div></div>
      <ul class="legend">
        <li><span class="dot finished"></span>Finished <strong>${s.finished}</strong></li>
        <li><span class="dot reading"></span>Reading <strong>${s.reading}</strong></li>
        <li><span class="dot want"></span>Want to Read <strong>${s.want}</strong></li>
      </ul>
    </div>`;
}

// Donut chart of total pages read compared with total pages
export function renderProgressChart(container, s) {
  container.innerHTML = `
    <div class="chart-row">
      <div class="donut single${s.totalPages ? "" : " empty-donut"}" style="--p:${s.progressPercent}%" role="img" aria-label="${s.progressPercent} percent read"><div class="donut-center">${s.progressPercent}%</div></div>
      <div class="legend"><strong>Total reading progress</strong><span>${s.pagesRead.toLocaleString()} / ${s.totalPages.toLocaleString()} pages</span></div>
    </div>`;
}

// The three books with the highest personal rating
export function renderTopRated(container, books) {
  container.innerHTML = books.length
    ? books.map((b) => `<li><span>${escapeHTML(b.title)}</span>${stars(b.userRating)}</li>`).join("")
    : `<li class="muted">Rate a book to see it here.</li>`;
}

// Bar chart: bar heights are percentages of the busiest month
export function renderActivityChart(container, activity) {
  const max = Math.max(1, ...activity.map((m) => m.count));

  container.innerHTML = `
    <div class="bars" role="img" aria-label="Books finished per month">
      ${activity.map((m, i) => `<div class="bar-col" title="${m.count} finished"><div class="bar" style="height:${(m.count / max) * 100}%;animation-delay:${i * 80}ms"></div></div>`).join("")}
    </div>
    <div class="bar-labels">${activity.map((m) => `<span>${m.label}</span>`).join("")}</div>
    <p class="muted">Books finished in the last 6 months.</p>`;
}
