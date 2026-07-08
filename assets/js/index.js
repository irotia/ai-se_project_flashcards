import { decks, getDeckByID } from "./decks.js";
import { stringToHex, hexToString, removeColorClasses } from "./colors.js";
import { renderCarouselView } from "./carousel.js";

function createDeckE1(deck) {
  const deckTemplateEl = document.querySelector("#deck__template");
  const cloneEl = deckTemplateEl.content.querySelector("li").cloneNode(true);

  const deckData = { ...deck };
  console.log("Creating deck clone:", deckData);

  // identify the deck element for later removal / data updates
  cloneEl.dataset.id = deckData.id;
  cloneEl.dataset.deckName = deckData.name;
  cloneEl.deckData = deckData;

  const deckLinkE1 = cloneEl.querySelector(".deck__link");
  if (deckLinkE1) {
    const newHref = `#carousel/${deckData.id}`;
    deckLinkE1.href = newHref;
    deckLinkE1.dataset.deckId = deckData.id;
    console.log(`Deck ${deckData.id} link href updated to: ${newHref}`);
  } else {
    console.log(`Deck ${deckData.id} has no .deck__link element`);
  }

  const deckTitleEl = cloneEl.querySelector(".deck__title");
  deckTitleEl.textContent = deckData.name;

  const countEl = cloneEl.querySelector(".deck__count");
  const cardCount = deck.cards.length;
  countEl.textContent = `${cardCount} ${cardCount === 1 ? "card" : "cards"}`;
  countEl.dataset.count = String(cardCount);

  if (deck.color) {
    const colorName = hexToString(deck.color);
    if (colorName) {
      removeColorClasses(cloneEl);
      cloneEl.classList.add(`deck_color_${colorName}`);
    }
    cloneEl.style.backgroundColor = deck.color;
  }

  // per-item delete handler
  const deleteBtn = cloneEl.querySelector(".deck__delete-btn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
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
  const listEl = document.querySelector(".decks__list");
  if (!listEl) return false;

  const li = listEl.querySelector(`li[data-id="${deckId}"]`);
  if (!li) return false;

  const countEl = li.querySelector(".deck__count");
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
  const listEl = document.querySelector(".decks__list");
  if (!listEl) return false;
  const li = listEl.querySelector(`li[data-id="${deckId}"]`);
  if (!li) return false;
  const countEl = li.querySelector(".deck__count");
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
  const deckContainerEl = document.querySelector(".decks__list");
  deckContainerEl.append(deckEl);
}

function renderAllDecks() {
  decks.forEach(renderDeckE1);
}

document.addEventListener("DOMContentLoaded", renderAllDecks);

function renderHomeView() {
  const homeSection = document.getElementById("decks");
  const notFoundSection = document.getElementById("not-found");
  const carouselSection = document.getElementById("carousel");
  const mainSection = document.querySelector(".page__main-content");

  if (homeSection) {
    homeSection.style.display = "block";
  }
  if (notFoundSection) {
    notFoundSection.style.display = "none";
  }
  if (carouselSection) {
    carouselSection.style.display = "none";
  }
  if (mainSection) {
    mainSection.classList.remove("page__main-content_location_carousel");
  }
}

function renderNotFoundView() {
  const homeSection = document.getElementById("decks");
  const notFoundSection = document.getElementById("not-found");
  const carouselSection = document.getElementById("carousel");
  const mainSection = document.querySelector(".page__main-content");

  if (homeSection) {
    homeSection.style.display = "none";
  }
  if (notFoundSection) {
    notFoundSection.style.display = "block";
  }
  if (carouselSection) {
    carouselSection.style.display = "none";
  }
  if (mainSection) {
    mainSection.classList.remove("page__main-content_location_carousel");
  }
}

/**
 * Main router function that handles hash changes.
 * Reads the current hash and renders the appropriate view.
 */
function router() {
  const rawHash = window.location.hash.slice(1).toLowerCase();

  if (!rawHash) {
    renderHomeView();
    return;
  }

  if (rawHash === "home") {
    renderHomeView();
    return;
  }

  if (rawHash.startsWith("carousel/")) {
    const [, deckId] = rawHash.split("carousel/");
    const deck = getDeckByID(deckId);

    const mainSection = document.querySelector(".page__main-content");
    if (mainSection) {
      mainSection.classList.add("page__main-content_location_carousel");
    }

    if (deck) {
      renderCarouselView(deck);
      return;
    }
  }

  renderNotFoundView();
}

window.addEventListener("DOMContentLoaded", router);
window.addEventListener("hashchange", router);
