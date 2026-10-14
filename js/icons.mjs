/* =====================================================================
   Icons Module
   All icons are small inline SVG strings. They use "currentColor", so
   CSS decides their color (for example, the wine color for the active
   navigation item). Using inline SVG avoids extra image requests and
   keeps the icons sharp at any size.
   ===================================================================== */

// Helper that wraps the drawing paths in a complete <svg> element
const svg = (paths, size = 22) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const icons = {
  book: svg('<path d="M2 5.5C5 4 8.5 4 12 6c3.5-2 7-2 10-.5V19c-3-1.5-6.5-1.5-10 .5-3.5-2-7-2-10-.5z"/><path d="M12 6v13.5"/>'),
  bookmark: svg('<path d="M6 3h12v18l-6-4-6 4z"/>'),
  check: svg('<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.5 2.5L16 9.5"/>'),
  star: svg('<path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6"/>'),
  home: svg('<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/>'),
  library: svg('<path d="M4 4v16M9 4v16M14 6.5l4 13.5 3-1-4-13.5z"/>'),
  chart: svg('<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>'),
  menu: svg('<path d="M4 6h16M4 12h16M4 18h16"/>'),
  dice: svg('<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="9" cy="15" r="1"/>'),
  alert: svg('<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/>', 26),
};
