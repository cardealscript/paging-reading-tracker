/* =====================================================================
   Statistics Page Module
   Calculates the numbers once and passes them to the render functions
   for the summary cards, the two donut charts, the Top Rated list and
   the six-month activity chart.
   ===================================================================== */
import { getLibrary } from "./storage.mjs";
import { calculateStats } from "./stats.mjs";
import { renderStatCards, renderStatusChart, renderProgressChart, renderTopRated, renderActivityChart } from "./ui.mjs";

export function initStatsPage() {
  const stats = calculateStats(getLibrary());

  renderStatCards(document.querySelector("#stat-cards"), stats);
  renderStatusChart(document.querySelector("#status-chart"), stats);
  renderProgressChart(document.querySelector("#progress-chart"), stats);
  renderTopRated(document.querySelector("#top-rated"), stats.topRated);
  renderActivityChart(document.querySelector("#activity-chart"), stats.activity);
}
