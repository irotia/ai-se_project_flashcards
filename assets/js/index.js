import { fetchedDecks, getDeckByID } from "./decks.js";
import { hexToString, removeColorClasses } from "./colors.js";
import { renderCarouselView } from "./carousel.js";
import { renderDeckView, showDeleteConfirmationModal } from "./deck-view.js";
import { deleteDeck, getDecks } from "./api.js";
import { showError, showView } from "./views.js";
import "./new-deck-view.js";

/**
 * Builds a deck list item element for the home gallery.
 *
 * @param {{_id: string, name: string, color?: string, cards?: Array<object>}} deck - Deck data.
 * @returns {HTMLLIElement} Rendered deck list item.
 */
function createDeckE1(deck) {
  const deckTemplateEl = document.querySelector("#deck__template");
  const cloneEl = deckTemplateEl.content.querySelector("li").cloneNode(true);

  const deckData = { ...deck };
  console.log("Creating deck clone:", deckData);

  // identify the deck element for later removal / data updates
  cloneEl.dataset._id = deckData._id;
  cloneEl.dataset.deckName = deckData.name;
  cloneEl.deckData = deckData;

  const deckLinkE1 = cloneEl.querySelector(".card__link");
  if (deckLinkE1) {
    const newHref = `#deck/${deckData._id}`;
    deckLinkE1.href = newHref;
    deckLinkE1.dataset.deckId = deckData._id;
    console.log(`Deck ${deckData._id} link href updated to: ${newHref}`);
  } else {
    console.log(`Deck ${deckData._id} has no .card__link element`);
  }

  const deckTitleEl = cloneEl.querySelector(".card__title");
  deckTitleEl.textContent = deckData.name;

  const countEl = cloneEl.querySelector(".card__count");
  const cards = Array.isArray(deck.cards) ? deck.cards : [];
  const cardCount = cards.length;
  countEl.textContent = `${cardCount} ${cardCount === 1 ? "card" : "cards"}`;
  countEl.dataset.count = String(cardCount);

  if (deck.color) {
    const colorName = hexToString(deck.color);
    if (colorName) {
      removeColorClasses(cloneEl);
      cloneEl.classList.add(`card_color_${colorName}`);
    }
    cloneEl.style.backgroundColor = deck.color;
  }

  // per-item delete handler
  const deleteBtn = cloneEl.querySelector(".card__delete-btn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const shouldDelete = await showDeleteConfirmationModal();
      if (!shouldDelete) return;

      deleteDeck(cloneEl.dataset._id)
        .then(() => {
          cloneEl.remove();
          // optional: also remove from in-memory data
          const deckIndex = fetchedDecks.findIndex(
            (deckObj) => deckObj._id === cloneEl.dataset._id,
          );
          if (deckIndex > -1) fetchedDecks.splice(deckIndex, 1);
        })
        .catch((error) => {
          showError(error);
        });
    });
  }

  return cloneEl;
}

/**
 * Updates a card count element label and dataset value.
 *
 * @param {HTMLElement} countEl - Element that shows the count text.
 * @param {number|string} count - Count to display.
 */
function setDeckCountElement(countEl, count) {
  const numericCount = Number(count) || 0;
  countEl.textContent = `${numericCount} ${numericCount === 1 ? "card" : "cards"}`;
  countEl.dataset.count = String(numericCount);
}

/**
 * Updates the displayed card count for a deck card by ID.
 *
 * @param {string} deckId - Deck identifier.
 * @param {number} newCount - New count value.
 * @param {{syncModel?: boolean}} [options] - Optional model-sync behavior.
 * @returns {boolean} True when a deck element was updated.
 */
export function updateDeckCountById(
  deckId,
  newCount,
  { syncModel = false } = {},
) {
  const listEl = document.querySelector(".gallery__list");
  if (!listEl) return false;

  const li = listEl.querySelector(`li[data-_id="${deckId}"]`);
  if (!li) return false;

  const countEl = li.querySelector(".card__count");
  if (!countEl) return false;

  setDeckCountElement(countEl, newCount);

  if (syncModel) {
    const deckIndex = fetchedDecks.findIndex(
      (deckObj) => deckObj._id === deckId || deckObj.name === deckId,
    );
    if (deckIndex > -1) {
      if (newCount < fetchedDecks[deckIndex].cards.length) {
        fetchedDecks[deckIndex].cards = fetchedDecks[deckIndex].cards.slice(
          0,
          newCount,
        );
      }
    }
  }

  return true;
}

/**
 * Increments or decrements the displayed card count by a delta.
 *
 * @param {string} deckId - Deck identifier.
 * @param {number} [delta=1] - Delta to apply to the current count.
 * @param {{syncModel?: boolean}} [options] - Optional model-sync behavior.
 * @returns {boolean} True when a deck element was updated.
 */
export function changeDeckCountById(deckId, delta = 1, options = {}) {
  const listEl = document.querySelector(".gallery__list");
  if (!listEl) return false;
  const li = listEl.querySelector(`li[data-_id="${deckId}"]`);
  if (!li) return false;
  const countEl = li.querySelector(".card__count");
  if (!countEl) return false;
  const current = Number(countEl.dataset.count) || 0;
  return updateDeckCountById(
    deckId,
    Math.max(0, current + Number(delta)),
    options,
  );
}

/**
 * Renders one deck card into the home deck list.
 *
 * @param {object} deck - Deck data.
 */
function renderDeckE1(deck) {
  const deckEl = createDeckE1(deck);
  const deckContainerEl = document.querySelector("#home .gallery__list");
  if (deckContainerEl) {
    deckContainerEl.append(deckEl);
  }
}

/**
 * Re-renders all fetched decks into the home deck list.
 */
function renderFetchedDecks() {
  const deckContainerEl = document.querySelector("#home .gallery__list");
  if (!deckContainerEl) return;

  deckContainerEl.innerHTML = "";
  fetchedDecks.forEach((deck) => renderDeckE1(deck));
}

/**
 * Attaches actions for controls on the home view.
 */
function bindHomeActions() {
  const newDeckButton = document.querySelector("#home .gallery__new-card-btn");
  if (!newDeckButton) return;

  newDeckButton.addEventListener("click", (event) => {
    event.preventDefault();
    window.location.hash = "#new-deck";
  });
}

/**
 * Wires new-deck form interaction state on the home page.
 */
function bindNewDeckForm() {
  const form = document.getElementById("new-deck-form");
  const textarea = document.querySelector(".new-deck-view__text-input");
  const submitButton = document.querySelector(".new-deck-view__submit-btn");
  const colorInputs = Array.from(
    document.querySelectorAll(".new-deck-view__color-input"),
  );

  if (!form || !textarea || !submitButton || colorInputs.length === 0) return;

  /**
   * Enables submit only when text and color are present.
   */
  function updateSubmitState() {
    const hasInput = textarea.value.trim().length > 0;
    const hasColorSelected = colorInputs.some((input) => input.checked);
    submitButton.disabled = !(hasInput && hasColorSelected);
  }

  textarea.addEventListener("input", updateSubmitState);
  colorInputs.forEach((input) =>
    input.addEventListener("change", updateSubmitState),
  );

  updateSubmitState();
}

/**
 * Shows and renders the home view.
 */
function renderHomeView() {
  showView("home");
  renderFetchedDecks();
}

/**
 * Shows the not-found view.
 */
function renderNotFoundView() {
  showView("not-found");
}

/**
 * Shows the about view.
 */
function renderAboutView() {
  showView("about");
}

document.addEventListener("DOMContentLoaded", () => {
  showView("home");
  bindHomeActions();
  bindNewDeckForm();

  getDecks()
    .then((decks) => {
      fetchedDecks.length = 0;
      fetchedDecks.push(...decks);
      renderFetchedDecks();
    })
    .catch((error) => {
      showError(error);
    })
    .finally(() => {
      router();
    });
});

/**
 * Main router function that handles hash changes.
 * Reads the current hash and renders the appropriate view.
 *
 * @returns {void}
 */
function router() {
  const rawHash = window.location.hash.slice(1).toLowerCase();

  if (!rawHash || rawHash === "home") {
    renderHomeView();
    return;
  }

  if (rawHash === "new-deck" || rawHash === "new-deck-view") {
    showView("new-deck-view");
    return;
  }

  if (rawHash === "about") {
    renderAboutView();
    return;
  }

  if (rawHash.startsWith("deck/")) {
    const deckId = rawHash.split("deck/")[1];
    const deck = getDeckByID(deckId);
    if (deck) {
      renderDeckView(deck);
      return;
    }
  }

  if (rawHash.startsWith("carousel/")) {
    const deckId = rawHash.split("carousel/")[1];
    const deck = getDeckByID(deckId);

    if (deck) {
      renderCarouselView(deck);
      return;
    }
  }

  renderNotFoundView();
}

window.addEventListener("hashchange", router);
