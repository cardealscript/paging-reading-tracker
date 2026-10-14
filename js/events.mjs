/* =====================================================================
   Global Events Module
   Interactions that exist on every page: the mobile menu and the
   Reset Reading Data confirmation dialog.

   Events used here: click (menu button), keydown (Escape key) and a
   single delegated click listener for the whole dialog flow.
   ===================================================================== */
import { resetReadingData } from "./storage.mjs";

export function initGlobalEvents() {
  const menuBtn = document.querySelector("#menu-btn");
  const nav = document.querySelector("#main-nav");
  const dialog = document.querySelector("#reset-dialog");

  // click: open and close the mobile menu, keeping aria attributes in sync
  menuBtn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  // keydown: the Escape key closes the menu
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) menuBtn.click();
  });

  // click (event delegation): one listener handles every part of the reset flow.
  // Buttons are found with data attributes, so any page can add a
  // "Reset Reading Data" button just by including data-open-reset.
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-open-reset]")) {
      dialog.showModal();
    } else if (e.target.closest("[data-cancel-reset]") || e.target === dialog) {
      dialog.close(); // Cancel button, or a click on the dark backdrop
    } else if (e.target.closest("[data-confirm-reset]")) {
      resetReadingData();
      dialog.close();
      location.reload(); // draw the page again, now empty
    }
  });
}
