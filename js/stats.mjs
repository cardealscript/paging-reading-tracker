/* =====================================================================
   Statistics Module
   Pure calculation functions: they receive the library array and return
   the numbers shown on the Home page and on the Statistics page.
   Array methods used: filter, reduce, sort, slice and map.
   ===================================================================== */

// Reading progress of one book as a whole percentage (0 to 100)
export function bookProgress(book) {
  if (!book.pages) return book.status === "finished" ? 100 : 0;
  return Math.min(100, Math.round(((book.currentPage || 0) / book.pages) * 100));
}

// Books finished in each of the last six months, for the activity chart
function monthlyActivity(library, months = 6) {
  const now = new Date();
  const result = [];

  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const count = library.filter((b) => {
      if (!b.finishedAt) return false;
      const d = new Date(b.finishedAt);
      return d.getFullYear() === start.getFullYear() && d.getMonth() === start.getMonth();
    }).length;
    result.push({ label: start.toLocaleString("en", { month: "short" }), count });
  }
  return result;
}

// Every number used by the dashboard and the Statistics page
export function calculateStats(library) {
  const count = (status) => library.filter((b) => b.status === status).length;
  const rated = library.filter((b) => b.userRating > 0);
  const pagesRead = library.reduce((sum, b) => sum + (b.currentPage || 0), 0);
  const totalPages = library.reduce((sum, b) => sum + (b.pages || 0), 0);

  return {
    total: library.length,
    want: count("want"),
    reading: count("reading"),
    finished: count("finished"),
    averageRating: rated.length ? rated.reduce((s, b) => s + b.userRating, 0) / rated.length : 0,
    pagesRead,
    totalPages,
    progressPercent: totalPages ? Math.round((pagesRead / totalPages) * 100) : 0,
    topRated: [...rated].sort((a, b) => b.userRating - a.userRating).slice(0, 3),
    activity: monthlyActivity(library),
  };
}

// Random Book Picker: prefers "Want to Read", otherwise any unfinished book
export function pickRandomBook(library) {
  let pool = library.filter((b) => b.status === "want");
  if (!pool.length) pool = library.filter((b) => b.status !== "finished");
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
}
