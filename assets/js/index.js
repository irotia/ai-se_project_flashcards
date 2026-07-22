import { decks, getDeckByID } from "./decks.js";
import { hexToString, removeColorClasses } from "./colors.js";
import { renderCarouselView } from "./carousel.js";
import { renderDeckView, showDeleteConfirmationModal } from "./deck-view.js";
import { showView } from "./views.js";

function createDeckE1(deck) {
  const deckTemplateEl = document.querySelector("#deck__template");
  const cloneEl = deckTemplateEl.content.querySelector("li").cloneNode(true);

  const deckData = { ...deck };
  console.log("Creating deck clone:", deckData);

  // identify the deck element for later removal / data updates
  cloneEl.dataset.id = deckData.id;
  cloneEl.dataset.deckName = deckData.name;
  cloneEl.deckData = deckData;

  const deckLinkE1 = cloneEl.querySelector(".card__link");
  if (deckLinkE1) {
    const newHref = `#deck/${deckData.id}`;
    deckLinkE1.href = newHref;
    deckLinkE1.dataset.deckId = deckData.id;
    console.log(`Deck ${deckData.id} link href updated to: ${newHref}`);
  } else {
    console.log(`Deck ${deckData.id} has no .card__link element`);
  }

  const deckTitleEl = cloneEl.querySelector(".card__title");
  deckTitleEl.textContent = deckData.name;

  const countEl = cloneEl.querySelector(".card__count");
  const cardCount = deck.cards.length;
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

      // remove from DOM
      cloneEl.remove();
      // optional: also remove from in-memory data
      const deckIndex = decks.findIndex(
        (deckObj) => deckObj.id === cloneEl.dataset.id,
      );
      if (deckIndex > -1) decks.splice(deckIndex, 1);
    });
  }

  return cloneEl;
}

function setDeckCountElement(countEl, count) {
  const numericCount = Number(count) || 0;
  countEl.textContent = `${numericCount} ${numericCount === 1 ? "card" : "cards"}`;
  countEl.dataset.count = String(numericCount);
}

export function updateDeckCountById(
  deckId,
  newCount,
  { syncModel = false } = {},
) {
  const listEl = document.querySelector(".gallery__list");
  if (!listEl) return false;

  const li = listEl.querySelector(`li[data-id="${deckId}"]`);
  if (!li) return false;

  const countEl = li.querySelector(".card__count");
  if (!countEl) return false;

  setDeckCountElement(countEl, newCount);

  if (syncModel) {
    const deckIndex = decks.findIndex(
      (deckObj) => deckObj.id === deckId || deckObj.name === deckId,
    );
    if (deckIndex > -1) {
      if (newCount < decks[deckIndex].cards.length) {
        decks[deckIndex].cards = decks[deckIndex].cards.slice(0, newCount);
      }
    }
  }

  return true;
}

export function changeDeckCountById(deckId, delta = 1, options = {}) {
  const listEl = document.querySelector(".gallery__list");
  if (!listEl) return false;
  const li = listEl.querySelector(`li[data-id="${deckId}"]`);
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

function renderDeckE1(deck) {
  const deckEl = createDeckE1(deck);
  const deckContainerEl = document.querySelector("#home .gallery__list");
  if (deckContainerEl) {
    deckContainerEl.append(deckEl);
  }
}

function renderAllDecks() {
  decks.forEach(renderDeckE1);
}

function bindHomeActions() {
  const newDeckButton = document.querySelector("#home .gallery__new-card-btn");
  if (!newDeckButton) return;

  newDeckButton.addEventListener("click", (event) => {
    event.preventDefault();
    window.location.hash = "#new-deck";
  });
}

function renderHomeView() {
  showView("home");
}

function renderNotFoundView() {
  showView("not-found");
}

document.addEventListener("DOMContentLoaded", () => {
  renderAllDecks();
  bindHomeActions();
  router();
});

/**
 * Main router function that handles hash changes.
 * Reads the current hash and renders the appropriate view.
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
