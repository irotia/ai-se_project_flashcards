import { hexToString, removeColorClasses } from "./colors.js";
import { showView } from "./views.js";

export function showDeleteConfirmationModal() {
  return new Promise((resolve) => {
    const modal = document.getElementById("delete-confirmation-modal");
    const cancelBtn = modal?.querySelector(".modal__btn_cancel");
    const confirmBtn = modal?.querySelector(".modal__btn_confirm");

    if (!modal || !cancelBtn || !confirmBtn) {
      resolve(false);
      return;
    }

    const closeModal = () => {
      modal.classList.add("hidden");
      modal.setAttribute("aria-hidden", "true");
      cancelBtn.removeEventListener("click", onCancel);
      confirmBtn.removeEventListener("click", onConfirm);
      modal.removeEventListener("click", onBackdropClick);
    };

    const onCancel = () => {
      closeModal();
      resolve(false);
    };

    const onConfirm = () => {
      closeModal();
      resolve(true);
    };

    const onBackdropClick = (event) => {
      if (event.target === modal) {
        closeModal();
        resolve(false);
      }
    };

    cancelBtn.addEventListener("click", onCancel);
    confirmBtn.addEventListener("click", onConfirm);
    modal.addEventListener("click", onBackdropClick);

    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    confirmBtn.focus();
  });
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
    deleteBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const shouldDelete = await showDeleteConfirmationModal();
      if (!shouldDelete) return;

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

  showView("deck-view");

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
