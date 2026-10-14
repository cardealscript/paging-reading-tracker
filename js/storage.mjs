/* =====================================================================
   Data Management Module (localStorage)
   Paging has no server, so everything the reader creates is saved in the
   browser with localStorage. Four separate properties are used:

     paging:library        the array of saved books (JSON)
     paging:lastSearch     the last search term, shown again on the next visit
     paging:libraryFilters the filters chosen on the My Library page
     paging:currentBook    the book just opened, so the details page loads fast

   Values are converted with JSON.stringify when saving and JSON.parse
   when reading. Every read and write is wrapped in try/catch so the site
   keeps working even if the browser blocks storage.
   ===================================================================== */

const KEYS = {
  library: "paging:library",
  lastSearch: "paging:lastSearch",
  filters: "paging:libraryFilters",
  currentBook: "paging:currentBook",
};

// Safe read: returns the fallback if the key is missing or the JSON is invalid
function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// Safe write: returns true when the value was saved
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/* ---------- Library: create, read, update and delete (CRUD) ---------- */

export const getLibrary = () => read(KEYS.library, []);
const saveLibrary = (library) => write(KEYS.library, library);
export const findBook = (id) => getLibrary().find((b) => b.id === id) || null;

// Create: a new book starts as "Want to Read" with empty reading data
export function addBook(book) {
  const library = getLibrary();
  const existing = library.find((b) => b.id === book.id);
  if (existing) return existing; // a book is never saved twice

  const saved = {
    ...book,
    status: "want",
    currentPage: 0,
    userRating: 0,
    notes: "",
    addedAt: new Date().toISOString(),
    finishedAt: null,
  };
  library.push(saved);
  saveLibrary(library);
  return saved;
}

// Delete
export function removeBook(id) {
  saveLibrary(getLibrary().filter((b) => b.id !== id));
}

// Update: merges the changes into the matching book and returns it
export function updateBook(id, changes) {
  const library = getLibrary().map((b) => (b.id === id ? { ...b, ...changes } : b));
  saveLibrary(library);
  return library.find((b) => b.id === id) || null;
}

// Changing the status also keeps the page counter and finish date consistent
export function setStatus(id, status) {
  const book = findBook(id);
  if (!book) return null;

  const changes = { status, finishedAt: null };
  if (status === "finished") {
    changes.finishedAt = new Date().toISOString();
    if (book.pages) changes.currentPage = book.pages; // finished means every page was read
  }
  if (status === "want") changes.currentPage = 0;
  return updateBook(id, changes);
}

// Updating the page also updates the status automatically:
// any progress means "Reading", and reaching the last page means "Finished".
export function setProgress(id, page) {
  const book = findBook(id);
  if (!book) return null;

  let current = Math.max(0, Math.floor(Number(page)) || 0);
  if (book.pages) current = Math.min(current, book.pages); // never beyond the last page

  const changes = { currentPage: current };
  if (book.pages && current >= book.pages) {
    changes.status = "finished";
    changes.finishedAt = new Date().toISOString();
  } else if (current > 0) {
    changes.status = "reading";
    changes.finishedAt = null;
  }
  return updateBook(id, changes);
}

export const setRating = (id, rating) => updateBook(id, { userRating: rating });
export const saveNote = (id, notes) => updateBook(id, { notes });

/* ---------- Small preferences (one localStorage property each) ---------- */

export const getLastSearch = () => read(KEYS.lastSearch, "");
export const setLastSearch = (term) => write(KEYS.lastSearch, term);
export const getFilters = () => read(KEYS.filters, null);
export const setFilters = (filters) => write(KEYS.filters, filters);
export const getCurrentBook = () => read(KEYS.currentBook, null);
export const setCurrentBook = (book) => write(KEYS.currentBook, book);

// Used by the "Reset Reading Data" confirmation dialog.
// The last search is kept because it is not reading data.
export function resetReadingData() {
  [KEYS.library, KEYS.filters, KEYS.currentBook].forEach((key) => localStorage.removeItem(key));
}
