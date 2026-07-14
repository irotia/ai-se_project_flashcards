import { hexToString, removeColorClasses } from "./colors.js";

function hideAllSections() {
  const homeSection = document.getElementById("home");
  const deckViewSection = document.getElementById("deck-view");
  const notFoundSection = document.getElementById("not-found");
  const carouselSection = document.getElementById("carousel");

  if (homeSection) homeSection.style.display = "none";
  if (deckViewSection) deckViewSection.style.display = "none";
  if (notFoundSection) notFoundSection.style.display = "none";
  if (carouselSection) carouselSection.style.display = "none";
}

function showSection(section, displayMode = "block") {
  if (!section) return;
  section.style.display = displayMode;
}

function createDeckViewCard(card, deck) {
  const cardTemplateEl = document.querySelector("#card__template");
  const cloneEl = cardTemplateEl.content.querySelector("li").cloneNode(true);

  cloneEl.dataset.cardId = card.id;
  cloneEl.dataset.deckId = deck.id;

  const cardTitleEl = cloneEl.querySelector(".card__title");
  const flipBtn = cloneEl.querySelector(".card__flip-btn");
  const deleteBtn = cloneEl.querySelector(".card__delete-btn");

  function updateCardFace(isFlipped) {
    if (isFlipped) {
      cloneEl.classList.add("card_state_flipped");
      cardTitleEl.textContent = card.answer;
    } else {
      cloneEl.classList.remove("card_state_flipped");
      cardTitleEl.textContent = card.question;
    }
  }

  updateCardFace(false);

  if (deck.color) {
    const colorName = hexToString(deck.color);
    if (colorName) {
      removeColorClasses(cloneEl);
      cloneEl.classList.add(`card_color_${colorName}`);
    }
    cloneEl.style.backgroundColor = deck.color;
  }

  let isFlipped = false;
  if (flipBtn) {
    flipBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      isFlipped = !isFlipped;
      updateCardFace(isFlipped);
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      cloneEl.remove();
      const cardIndex = deck.cards.findIndex(
        (deckCard) => deckCard.id === card.id,
      );
      if (cardIndex > -1) deck.cards.splice(cardIndex, 1);
    });
  }

  return cloneEl;
}

export function renderDeckView(deck) {
  const deckViewSection = document.getElementById("deck-view");
  const titleEl = deckViewSection?.querySelector(".gallery__title");
  const deckListEl = deckViewSection?.querySelector(".gallery__list");
  const practiceBtn = deckViewSection?.querySelector(".practice-btn");
  const mainSection = document.querySelector(".page__main-content");

  if (!deckViewSection) return;

  hideAllSections();
  showSection(deckViewSection, "block");

  if (titleEl) titleEl.textContent = deck.name;
  if (deckListEl) {
    deckListEl.innerHTML = "";
    deck.cards.forEach((card) => {
      deckListEl.append(createDeckViewCard(card, deck));
    });
  }

  if (practiceBtn) {
    practiceBtn.onclick = (event) => {
      event.preventDefault();
      window.location.hash = `#carousel/${deck.id}`;
    };
  }

  if (mainSection) {
    mainSection.classList.remove("page__main-content_location_carousel");
  }
}
