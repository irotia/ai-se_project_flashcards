import { fetchedDecks, getDeckByID } from "./decks.js";
import { hexToString, removeColorClasses } from "./colors.js";
import { renderCarouselView } from "./carousel.js";
import { renderDeckView, showDeleteConfirmationModal } from "./deck-view.js";
import { deleteDeck, getDecks } from "./api.js";
import { showError, showView } from "./views.js";
import "./new-deck-view.js";

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

function renderDeckE1(deck) {
  const deckEl = createDeckE1(deck);
  const deckContainerEl = document.querySelector("#home .gallery__list");
  if (deckContainerEl) {
    deckContainerEl.append(deckEl);
  }
}

function bindHomeActions() {
  const newDeckButton = document.querySelector("#home .gallery__new-card-btn");
  if (!newDeckButton) return;

  newDeckButton.addEventListener("click", (event) => {
    event.preventDefault();
    window.location.hash = "#new-deck";
  });
}

function bindNewDeckForm() {
  const form = document.getElementById("new-deck-form");
  const textarea = document.querySelector(".new-deck-view__text-input");
  const submitButton = document.querySelector(".new-deck-view__submit-btn");
  const colorInputs = Array.from(
    document.querySelectorAll(".new-deck-view__color-input"),
  );

  if (!form || !textarea || !submitButton || colorInputs.length === 0) return;

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

function renderHomeView() {
  showView("home");
}

function renderNotFoundView() {
  showView("not-found");
}

document.addEventListener("DOMContentLoaded", () => {
  showView("home");
  bindHomeActions();
  bindNewDeckForm();

  getDecks()
    .then((decks) => {
      fetchedDecks.push(...decks);
      decks.forEach(renderDeckE1);
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
