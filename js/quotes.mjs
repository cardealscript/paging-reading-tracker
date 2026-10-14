/* =====================================================================
   Quote Slider Module
   The dark banner on the Home page rotates through short phrases about
   reading. Each phrase fades out, the text is swapped, and the next
   phrase slides in (the animations are defined in the CSS).

   Events used: click (dots), mouseenter and mouseleave (pause while the
   reader is looking), visibilitychange (pause when the tab is hidden).
   ===================================================================== */

const QUOTES = [
  "Good books build better tomorrows.",
  "One page a day becomes a whole library.",
  "Every book you finish makes your world bigger.",
  "Read slowly, think deeply, remember always.",
  "Today's pages are tomorrow's ideas.",
];
const INTERVAL = 4000; // each phrase stays for 4 seconds

export function initQuoteSlider() {
  const text = document.querySelector("#quote-text");
  const dotsBox = document.querySelector("#quote-dots");
  if (!text || !dotsBox) return; // only the Home page has this banner

  let index = 0;
  let timer = null;

  // One navigation dot for each phrase
  dotsBox.innerHTML = QUOTES.map(
    (_, i) => `<button type="button" class="quote-dot" data-index="${i}" aria-label="Show phrase ${i + 1}"></button>`
  ).join("");
  const dots = dotsBox.querySelectorAll(".quote-dot");

  // The dot of the current phrase stretches into a pill
  function updateDots() {
    dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
  }

  // Shows phrase number i. The modulo makes the slider loop forever.
  function show(i) {
    index = (i + QUOTES.length) % QUOTES.length;
    updateDots();

    text.classList.remove("quote-in");
    text.classList.add("quote-out"); // current phrase fades out
    setTimeout(() => {
      text.textContent = QUOTES[index];
      text.classList.remove("quote-out");
      void text.offsetWidth; // forces the browser to restart the entrance animation
      text.classList.add("quote-in"); // new phrase slides in
    }, 350);
  }

  const stop = () => clearInterval(timer);
  const start = () => {
    stop(); // never run two timers at the same time
    timer = setInterval(() => show(index + 1), INTERVAL);
  };

  // click: jump to the chosen phrase and restart the timer
  dotsBox.addEventListener("click", (e) => {
    const dot = e.target.closest(".quote-dot");
    if (!dot) return;
    show(Number(dot.dataset.index));
    start();
  });

  // mouseenter and mouseleave: pause while the reader is on the banner
  const banner = text.closest(".hero-banner");
  banner.addEventListener("mouseenter", stop);
  banner.addEventListener("mouseleave", start);

  // visibilitychange: no need to animate while the tab is in the background
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  updateDots();
  start();
}
