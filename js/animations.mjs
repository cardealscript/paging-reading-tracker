/* =====================================================================
   Animation Module
   Small helpers that trigger the visual feedback defined in the CSS:
   the loading spinner, the card flip, the staggered entrance of search
   results and the toast message.
   ===================================================================== */

// Shows a spinner and a message while an API request is running
export function showLoader(statusEl, message = "Loading…") {
  statusEl.classList.remove("error");
  statusEl.innerHTML = `<div class="spinner" aria-hidden="true"></div><p>${message}</p>`;
}

// Adds or removes the "flipped" class; the 3D rotation itself is done in CSS
export const toggleFlip = (card) => card.classList.toggle("flipped");

// Gives each result card an index (--i). The CSS uses it to delay the
// entrance animation, so the cards appear one after another.
export function staggerItems(container) {
  container.querySelectorAll(".book-item").forEach((item, i) => item.style.setProperty("--i", i));
}

// Short feedback message at the bottom of the screen (e.g. "Added to My Library")
let toastTimer;
export function showToast(message) {
  let toast = document.querySelector("#toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    toast.setAttribute("role", "status"); // announced by screen readers
    document.body.append(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}
