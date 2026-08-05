const SECTION_IDS = [
  "home",
  "deck-view",
  "about",
  "not-found",
  "carousel",
  "new-deck-view",
];

/**
 * Hides all app sections managed by the router.
 */
export function hideAllSections() {
  SECTION_IDS.forEach((sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.style.display = "none";
    }
  });
}

/**
 * Displays an error message in the UI, or logs if no UI target is present.
 *
 * @param {string} message - Error message to display.
 */
export function showError(message) {
  const errorEl = document.querySelector(".error");
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = "block";
    return;
  }

  console.error(message);
}

/**
 * Shows one section and hides all others.
 *
 * @param {string} viewId - Section ID to display.
 * @param {{displayMode?: string}} [options] - Optional display mode override.
 * @returns {HTMLElement|null} The displayed section, or null when not found.
 */
export function showView(viewId, { displayMode = "block" } = {}) {
  hideAllSections();

  const section = document.getElementById(viewId);
  if (!section) return null;

  section.style.display = displayMode;

  const mainSection = document.querySelector(".page__main-content");
  if (mainSection) {
    mainSection.classList.toggle(
      "page__main-content_location_carousel",
      viewId === "carousel",
    );
  }

  const pageEl = document.querySelector(".page");
  if (pageEl) {
    pageEl.classList.toggle("no-mobile-fade", viewId === "new-deck-view");
  }

  return section;
}
