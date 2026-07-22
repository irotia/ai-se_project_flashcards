const SECTION_IDS = [
  "home",
  "deck-view",
  "not-found",
  "carousel",
  "new-deck-view",
];

export function hideAllSections() {
  SECTION_IDS.forEach((sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.style.display = "none";
    }
  });
}

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

  return section;
}
