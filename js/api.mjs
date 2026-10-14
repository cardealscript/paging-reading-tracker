/* =====================================================================
   API Module (third-party APIs)
   Paging combines two public APIs and three different endpoints:

     1. Open Library  /search.json       -> list of books for a search
     2. Open Library  /works/{id}.json   -> full description of one book
     3. Google Books  /books/v1/volumes  -> pages, publisher, rating, preview

   Every function uses fetch with async/await. The JSON that comes back
   is converted into one consistent book object (see makeBook), so the
   rest of the application does not depend on the format of either API.
   ===================================================================== */

const OPEN_LIBRARY = "https://openlibrary.org";
const GOOGLE_BOOKS = "https://www.googleapis.com/books/v1/volumes";

// Only the fields the application needs; this keeps the response small
const SEARCH_FIELDS = "key,title,author_name,first_publish_year,cover_i,isbn,subject,number_of_pages_median,publisher,ratings_average";

// Shared request helper: throws an error when the server answers with a failure
async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}

const coverUrl = (id, size) => (id ? `https://covers.openlibrary.org/b/id/${id}-${size}.jpg` : "");

// The book object used everywhere in the app (more than ten attributes).
// Starting from default values guarantees that no property is ever missing.
function makeBook(data = {}) {
  return {
    id: "", title: "Untitled", authors: [], year: null, cover: "", coverLarge: "",
    pages: null, subjects: [], publisher: "", isbn: "", rating: null,
    description: "", publishedDate: "", previewLink: "",
    ...data,
  };
}

// Converts one Open Library search result into our book object
function normalizeOpenLibrary(doc) {
  return makeBook({
    id: doc.key.replace("/works/", ""), // "/works/OL45883W" becomes "OL45883W"
    title: doc.title,
    authors: doc.author_name || [],
    year: doc.first_publish_year || null,
    cover: coverUrl(doc.cover_i, "M"),
    coverLarge: coverUrl(doc.cover_i, "L"),
    pages: doc.number_of_pages_median || null,
    subjects: (doc.subject || []).slice(0, 8),
    publisher: (doc.publisher || [])[0] || "",
    isbn: (doc.isbn || [])[0] || "",
    rating: doc.ratings_average ? Number(doc.ratings_average.toFixed(1)) : null,
  });
}

/* ---------- Endpoint 1: search ---------- */
export async function searchBooks(query, limit = 24) {
  const url = `${OPEN_LIBRARY}/search.json?q=${encodeURIComponent(query)}&limit=${limit}&fields=${SEARCH_FIELDS}`;
  const data = await fetchJSON(url);
  return (data.docs || []).map(normalizeOpenLibrary);
}

// Some descriptions contain HTML; this keeps only the readable text
function stripHtml(html = "") {
  return new DOMParser().parseFromString(html, "text/html").body.textContent.trim();
}

/* ---------- Endpoint 2: one work ---------- */
async function fetchWork(id) {
  const work = await fetchJSON(`${OPEN_LIBRARY}/works/${id}.json`);
  // The API returns the description either as text or as an object { value }
  const description = typeof work.description === "string" ? work.description : work.description?.value || "";
  return { work, description };
}

// Used when someone opens a details link directly (nothing in memory yet).
// First it asks the search endpoint; if that fails it builds the book from the work itself.
export async function getBookById(id) {
  try {
    const found = await searchBooks(`key:/works/${id}`, 1);
    if (found[0]) return found[0];
  } catch {
    /* the fallback below handles this case */
  }

  const { work, description } = await fetchWork(id);
  const authorResults = await Promise.allSettled(
    (work.authors || []).map((a) => fetchJSON(`${OPEN_LIBRARY}${a.author.key}.json`))
  );

  return makeBook({
    id,
    title: work.title,
    authors: authorResults.filter((r) => r.status === "fulfilled").map((r) => r.value.name),
    cover: coverUrl(work.covers?.[0], "M"),
    coverLarge: coverUrl(work.covers?.[0], "L"),
    subjects: (work.subjects || []).slice(0, 8),
    description: stripHtml(description),
  });
}

/* ---------- Endpoint 3: Google Books ---------- */
async function fetchGoogle(book) {
  // The ISBN identifies the exact edition; otherwise search by title and author.
  // A normal space is used between the terms because encodeURIComponent
  // would turn a "+" into a literal plus sign.
  const q = book.isbn
    ? `isbn:${book.isbn}`
    : `intitle:"${book.title}"${book.authors[0] ? ` inauthor:"${book.authors[0]}"` : ""}`;

  const data = await fetchJSON(`${GOOGLE_BOOKS}?q=${encodeURIComponent(q)}&maxResults=1`);
  const info = data.items?.[0]?.volumeInfo;
  if (!info) return null;

  return {
    description: stripHtml(info.description),
    pages: info.pageCount || null,
    publisher: info.publisher || "",
    publishedDate: info.publishedDate || "",
    categories: info.categories || [],
    rating: info.averageRating || null,
    previewLink: info.previewLink || info.infoLink || "",
    cover: info.imageLinks?.thumbnail?.replace("http://", "https://") || "",
  };
}

// Calls endpoints 2 and 3 at the same time (Promise.allSettled) and merges them.
// If one API fails, the other still provides useful data.
export async function getBookDetails(book) {
  const [workResult, googleResult] = await Promise.allSettled([fetchWork(book.id), fetchGoogle(book)]);
  const work = workResult.status === "fulfilled" ? workResult.value : null;
  const google = googleResult.status === "fulfilled" ? googleResult.value : null;

  return makeBook({
    ...book,
    description: google?.description || stripHtml(work?.description) || book.description,
    pages: book.pages || google?.pages || null,
    publisher: book.publisher || google?.publisher || "",
    publishedDate: google?.publishedDate || (book.year ? String(book.year) : ""),
    subjects: book.subjects.length ? book.subjects : (google?.categories || work?.work.subjects || []).slice(0, 8),
    rating: book.rating || google?.rating || null,
    previewLink: google?.previewLink || "",
    cover: book.cover || google?.cover || "",
    coverLarge: book.coverLarge || google?.cover || book.cover,
  });
}

// "Similar Books" tab: another search using the book's first category (or its author)
export async function getSimilarBooks(book) {
  const topic = book.subjects[0];
  const query = topic ? `subject:"${topic}"` : `author:"${book.authors[0] || book.title}"`;
  const books = await searchBooks(query, 9);
  return books.filter((b) => b.id !== book.id).slice(0, 6);
}
