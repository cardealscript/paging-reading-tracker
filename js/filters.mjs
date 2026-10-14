/* =====================================================================
   Filters Module
   Filtering and sorting for the My Library page. The functions never
   change the original array; they always return a new one.
   ===================================================================== */
import { bookProgress } from "./stats.mjs";

// Starting values, also used by the "Reset Filters" button
export const defaultFilters = { status: "all", category: "all", rating: "all", sort: "recent", query: "" };

// Keeps only the books that match every active filter
export function filterBooks(library, f) {
  const query = f.query.trim().toLowerCase();

  return library.filter((b) => {
    if (f.status !== "all" && b.status !== f.status) return false;
    if (f.category !== "all" && !(b.subjects || []).includes(f.category)) return false;
    if (f.rating === "unrated" && b.userRating) return false;
    if (/^[1-5]$/.test(f.rating) && b.userRating < Number(f.rating)) return false; // "4 stars and up"
    if (query && !`${b.title} ${b.authors.join(" ")}`.toLowerCase().includes(query)) return false;
    return true;
  });
}

// One comparison function for each option of the "Sort by" menu
const sorters = {
  recent: (a, b) => b.addedAt.localeCompare(a.addedAt),
  title: (a, b) => a.title.localeCompare(b.title),
  author: (a, b) => (a.authors[0] || "").localeCompare(b.authors[0] || ""),
  rating: (a, b) => b.userRating - a.userRating,
  progress: (a, b) => bookProgress(b) - bookProgress(a),
};

export const sortBooks = (books, sort) => [...books].sort(sorters[sort] || sorters.recent);
