import { hexToString, removeColorClasses } from "./colors.js";
import { addCard, deleteCard, updateCard } from "./api.js";
import { showError, showView } from "./views.js";

/**
 * Opens the delete confirmation modal and resolves with the user decision.
 *
 * @returns {Promise<boolean>} True when confirmed, otherwise false.
 */
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

/**
 * Resolves a card identifier regardless of whether API returns id or _id.
 *
 * @param {{_id?: string, id?: string|number}} card - Card object.
 * @returns {string} Normalized card identifier.
 */
function getCardId(card) {
  return String(card?._id ?? card?.id ?? "");
}

/**
 * Ensures a deck has a mutable cards array and returns it.
 *
 * @param {{cards?: Array<object>}} deck - Deck object.
 * @returns {Array<object>} Deck cards array.
 */
function ensureDeckCards(deck) {
  if (!Array.isArray(deck.cards)) {
    deck.cards = [];
  }
  return deck.cards;
}

/**
 * Ensures the deck view contains a New Card button and returns it.
 *
 * @param {HTMLElement} deckViewSection - Deck view section element.
 * @returns {HTMLButtonElement|null} The New Card button element.
 */
function ensureNewCardButton(deckViewSection) {
  const wrappingRow = deckViewSection.querySelector(".wrapping-row");
  if (!wrappingRow) return null;

  let newCardBtn = wrappingRow.querySelector(".gallery__new-card-btn");
  if (!newCardBtn) {
    newCardBtn = document.createElement("button");
    newCardBtn.type = "button";
    newCardBtn.className = "gallery__new-card-btn";
    newCardBtn.setAttribute("aria-label", "New Card Button");
    newCardBtn.textContent = "+ New Card";
    wrappingRow.append(newCardBtn);
  }

  // Keep the action tile at the end of the grid after all card items.
  if (wrappingRow.lastElementChild !== newCardBtn) {
    wrappingRow.append(newCardBtn);
  }

  newCardBtn.hidden = false;
  newCardBtn.style.display = "flex";
  return newCardBtn;
}

/**
 * Applies front/back color treatment for a card element.
 *
 * @param {HTMLLIElement} cardEl - Card element.
 * @param {{color?: string}} deck - Parent deck.
 * @param {boolean} isFlipped - Whether answer side is visible.
 */
function applyCardColor(cardEl, deck, isFlipped) {
  removeColorClasses(cardEl);

  if (isFlipped) {
    cardEl.classList.add("card_state_flipped");
    return;
  }

  cardEl.classList.remove("card_state_flipped");
  if (deck.color) {
    const colorName = hexToString(deck.color);
    if (colorName) {
      cardEl.classList.add(`card_color_${colorName}`);
    }
    cardEl.style.backgroundColor = deck.color;
  }
}

/**
 * Creates an editable card UI with one form containing question and answer.
 *
 * @param {{_id: string, color?: string}} deck - Parent deck.
 * @param {{_id?: string, id?: string|number, question?: string, answer?: string}|null} card - Existing card for edit mode.
 * @param {(savedCard: object) => void} onSaved - Callback invoked after API save.
 * @returns {HTMLLIElement} Editable card element.
 */
function createCardEditor(deck, card, onSaved) {
  const cardTemplateEl = document.querySelector("#card__template");
  const cloneEl = cardTemplateEl.content.querySelector("li").cloneNode(true);
  const titleEl = cloneEl.querySelector(".card__title");
  const rowEl = cloneEl.querySelector(".card__row");
  const flipBtn = cloneEl.querySelector(".card__flip-btn");
  const editBtn = cloneEl.querySelector(".card__edit-btn");
  const deleteBtn = cloneEl.querySelector(".card__delete-btn");

  rowEl?.classList.add("card__row_type_editor-actions");

  const formEl = document.createElement("form");
  formEl.className = "card__form";

  const questionInput = document.createElement("textarea");
  questionInput.className = "card__input card__input_type_question";
  questionInput.name = "question";
  questionInput.placeholder = "Type the question or term";
  questionInput.value = card?.question ?? "";
  questionInput.required = true;
  questionInput.rows = 2;

  const answerInput = document.createElement("textarea");
  answerInput.className = "card__input card__input_type_answer";
  answerInput.name = "answer";
  answerInput.placeholder = "Type the answer or definition";
  answerInput.value = card?.answer ?? "";
  answerInput.required = true;
  answerInput.hidden = true;
  answerInput.rows = 2;

  formEl.append(questionInput, answerInput, rowEl);
  titleEl.replaceWith(formEl);

  let showingAnswer = false;

  /**
   * Toggles which side of the edit form is visible.
   */
  function renderFormFace() {
    questionInput.hidden = showingAnswer;
    answerInput.hidden = !showingAnswer;
    applyCardColor(cloneEl, deck, showingAnswer);
  }

  if (editBtn) {
    editBtn.classList.remove("card__edit-btn");
    editBtn.classList.add("card__check-btn");
    editBtn.type = "submit";
    editBtn.setAttribute("aria-label", "Save Card Button");
  }

  if (deleteBtn) {
    deleteBtn.style.display = "none";
  }

  flipBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    showingAnswer = !showingAnswer;
    renderFormFace();
  });

  formEl.addEventListener("submit", (event) => {
    event.preventDefault();

    const question = questionInput.value.trim();
    const answer = answerInput.value.trim();
    if (!question || !answer) return;

    const payload = { question, answer };
    const request = card
      ? updateCard(getCardId(card), payload)
      : addCard(deck._id, payload);

    request
      .then((savedCard) => {
        onSaved({
          ...card,
          ...savedCard,
          question,
          answer,
        });
      })
      .catch((error) => {
        showError(error);
      });
  });

  cloneEl.classList.add("card_editing");
  renderFormFace();
  return cloneEl;
}

/**
 * Creates a deck-view card element with flip and delete behavior.
 *
 * @param {{id: number|string, question: string, answer: string}} card - Card data.
 * @param {{_id: string, color?: string, cards: Array<object>}} deck - Parent deck data.
 * @returns {HTMLLIElement} Rendered card list item.
 */
function createDeckViewCard(card, deck) {
  const cardTemplateEl = document.querySelector("#card__template");
  const cloneEl = cardTemplateEl.content.querySelector("li").cloneNode(true);
  const cardId = getCardId(card);

  cloneEl.dataset.cardId = cardId;
  cloneEl.dataset.deckId = deck._id;

  const cardTitleEl = cloneEl.querySelector(".card__title");
  const rowEl = cloneEl.querySelector(".card__row");
  const flipBtn = cloneEl.querySelector(".card__flip-btn");
  const editBtn = cloneEl.querySelector(".card__edit-btn");
  const deleteBtn = cloneEl.querySelector(".card__delete-btn");

  rowEl?.classList.add("card__row_type_card-actions");

  /**
   * Sets card text and class state for front or back face.
   *
   * @param {boolean} isFlipped - Whether the answer side is visible.
   */
  function updateCardFace(isFlipped) {
    if (isFlipped) {
      cardTitleEl.textContent = card.answer;
    } else {
      cardTitleEl.textContent = card.question;
    }
    applyCardColor(cloneEl, deck, isFlipped);
  }

  updateCardFace(false);

  let isFlipped = false;
  if (flipBtn) {
    flipBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      isFlipped = !isFlipped;
      updateCardFace(isFlipped);
    });
  }

  if (editBtn) {
    editBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const editorEl = createCardEditor(deck, card, (updatedCard) => {
        const cards = ensureDeckCards(deck);
        const cardIndex = cards.findIndex(
          (deckCard) => getCardId(deckCard) === cardId,
        );
        if (cardIndex > -1) {
          cards[cardIndex] = updatedCard;
        }
        renderDeckView(deck);
      });

      cloneEl.replaceWith(editorEl);
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const shouldDelete = await showDeleteConfirmationModal();
      if (!shouldDelete) return;

      deleteCard(cardId)
        .then(() => {
          cloneEl.remove();
          const cards = ensureDeckCards(deck);
          const cardIndex = cards.findIndex(
            (deckCard) => getCardId(deckCard) === cardId,
          );
          if (cardIndex > -1) cards.splice(cardIndex, 1);
        })
        .catch((error) => {
          showError(error);
        });
    });
  }

  return cloneEl;
}

/**
 * Renders the selected deck page and binds practice navigation.
 *
 * @param {{_id: string, name: string, cards?: Array<object>}} deck - Deck to render.
 */
export function renderDeckView(deck) {
  const deckViewSection = document.getElementById("deck-view");
  const titleEl = deckViewSection?.querySelector(".gallery__title");
  const deckListEl = deckViewSection?.querySelector(".gallery__list");
  const practiceBtn = deckViewSection?.querySelector(".practice-btn");
  const mainSection = document.querySelector(".page__main-content");

  if (!deckViewSection) return;

  const newCardBtn = ensureNewCardButton(deckViewSection);

  showView("deck-view");

  if (titleEl) titleEl.textContent = deck.name;
  if (deckListEl) {
    const cards = ensureDeckCards(deck);
    deckListEl.innerHTML = "";
    cards.forEach((card) => {
      deckListEl.append(createDeckViewCard(card, deck));
    });
  }

  if (newCardBtn && deckListEl) {
    newCardBtn.onclick = (event) => {
      event.preventDefault();

      const existingEditor = deckListEl.querySelector(".card_editing");
      if (existingEditor) {
        existingEditor.remove();
      }

      const editorEl = createCardEditor(deck, null, (createdCard) => {
        const cards = ensureDeckCards(deck);
        cards.push(createdCard);
        renderDeckView(deck);
      });

      deckListEl.append(editorEl);
    };
  }

  if (practiceBtn) {
    practiceBtn.style.display = "inline-block";
    practiceBtn.onclick = (event) => {
      event.preventDefault();
      window.location.hash = `#carousel/${deck._id}`;
    };
  }

  if (mainSection) {
    mainSection.classList.remove("page__main-content_location_carousel");
  }
}
