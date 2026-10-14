/* =====================================================================
   Book Details Module
   Loads one book, shows its information and lets the reader track it:
   add or remove it from the library, update the current page, change
   the status, give a star rating and write notes.

   Where the book data comes from (fastest source first):
     1. the saved library
     2. the book chosen on the Home page (localStorage "currentBook")
     3. the Open Library API, using the id in the address (?id=OL...W)
   A second step then asks Open Library and Google Books for the full
   description, page count and publisher.

   Events used on this page:
     click   every button, using one delegated listener and data-action
     change  status menu
     input   keeps an unsaved note while the page is redrawn
   ===================================================================== */
import { getBookById, getBookDetails, getSimilarBooks } from "./api.mjs";
import { findBook, addBook, removeBook, updateBook, setStatus, setProgress, setRating, saveNote, getCurrentBook, setCurrentBook } from "./storage.mjs";
import { renderDetailsPage } from "./ui.mjs";
import { showToast } from "./animations.mjs";

export async function initDetails() {
  const root = document.querySelector("#details-root");
  const id = new URLSearchParams(location.search).get("id");

  if (!id) {
    root.innerHTML = `<p class="empty">No book selected. <a href="index.html#search">Search for a book</a>.</p>`;
    return;
  }

  // One object describes the whole page; draw() always renders it from this state
  const state = { book: null, saved: findBook(id), loading: true, tab: "description", draftNotes: undefined, similar: null };
  const draw = () => renderDetailsPage(root, state);

  // Step 1: find the basic book data
  const current = getCurrentBook();
  state.book = state.saved || (current && current.id === id ? current : null);
  try {
    if (!state.book) state.book = await getBookById(id);
  } catch (error) {
    console.error(error);
    root.innerHTML = `<p class="status error">Could not load this book. <a href="index.html">Back to Home</a></p>`;
    return;
  }
  document.title = `${state.book.title} — Paging`;
  draw(); // the page is already useful while the description loads

  // Step 2: enrich the book with the second API
  try {
    state.book = await getBookDetails(state.book);
    if (state.saved) {
      // a saved book keeps the improved data too
      state.saved = updateBook(id, {
        description: state.book.description, pages: state.book.pages, publisher: state.book.publisher,
        publishedDate: state.book.publishedDate, previewLink: state.book.previewLink, subjects: state.book.subjects,
      });
    }
    setCurrentBook(state.book);
  } catch (error) {
    console.error(error);
  }
  state.loading = false;
  draw();

  // The "Similar Books" tab loads only when the reader opens it
  async function loadSimilar() {
    try { state.similar = await getSimilarBooks(state.book); } catch { state.similar = []; }
    draw();
  }

  // click (event delegation): every button carries a data-action attribute
  root.addEventListener("click", async (e) => {
    const similarLink = e.target.closest("[data-similar]");
    if (similarLink) return setCurrentBook(state.similar[Number(similarLink.dataset.similar)]);

    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const { action, tab, value } = btn.dataset;

    switch (action) {
      case "back":
        return history.length > 1 ? history.back() : (location.href = "index.html");

      case "tab":
        state.tab = tab;
        draw();
        if (tab === "similar" && state.similar === null) loadSimilar();
        return;

      case "add":
        state.saved = addBook(state.book);
        showToast("Added to My Library");
        break;

      case "remove":
        if (!confirm("Remove this book and its notes from your library?")) return;
        removeBook(id);
        state.saved = null;
        showToast("Removed from library");
        break;

      case "share": {
        // Uses the phone's share menu when available, otherwise copies the link
        const data = { title: state.book.title, url: location.href };
        if (navigator.share) {
          try { await navigator.share(data); } catch { /* the reader cancelled */ }
        } else {
          try { await navigator.clipboard.writeText(location.href); showToast("Link copied"); } catch { showToast("Could not copy the link"); }
        }
        return;
      }

      case "update-progress":
        state.saved = setProgress(id, document.querySelector("#page-input").value);
        showToast("Progress updated");
        break;

      case "rate": {
        // Clicking the current rating again removes it
        const rating = Number(value) === state.saved.userRating ? 0 : Number(value);
        state.saved = setRating(id, rating);
        break;
      }

      case "save-note":
        state.saved = saveNote(id, document.querySelector("#notes-input").value);
        state.draftNotes = undefined;
        showToast("Note saved");
        break;
    }
    draw();
  });

  // change: the status menu updates the library right away
  root.addEventListener("change", (e) => {
    if (e.target.id !== "status-select" || !state.saved) return;
    state.saved = setStatus(id, e.target.value);
    showToast("Status updated");
    draw();
  });

  // input: remember what the reader is typing, so a redraw never erases a note
  root.addEventListener("input", (e) => {
    if (e.target.id === "notes-input") state.draftNotes = e.target.value;
  });
}
