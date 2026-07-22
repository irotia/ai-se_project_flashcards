import { hexToString, removeColorClasses } from "./colors.js";
import { showView } from "./views.js";

function renderCarouselView(deck) {
  if (!deck) return;

  let currentIndex = 0;
  let showingAnswer = false;

  const carouselEl = document.getElementById("carousel");
  const decksEl = document.getElementById("decks");
  const notFoundEl = document.getElementById("not-found");
  if (!carouselEl) return;

  const titleEl = carouselEl.querySelector(".carousel__title");
  const leftBtn = carouselEl.querySelector(".carousel__btn_type_left");
  const rightBtn = carouselEl.querySelector(".carousel__btn_type_right");
  const flipBtn = carouselEl.querySelector(".carousel__btn_type_flip");
  const cardEl = carouselEl.querySelector(".carousel__card");
  const cardTextEl = carouselEl.querySelector(".carousel__card-text");

  function disableButton(buttonEl) {
    if (!buttonEl) return;
    buttonEl.classList.add("carousel__btn_disabled");
    buttonEl.disabled = true;
  }
  function enableButton(buttonEl) {
    if (!buttonEl) return;
    buttonEl.classList.remove("carousel__btn_disabled");
    buttonEl.removeAttribute("disabled");
  }

  function updateArrows() {
    if (!leftBtn || !rightBtn) return;
    if (currentIndex === 0) {
      disableButton(leftBtn);
    } else {
      enableButton(leftBtn);
    }

    if (currentIndex === deck.cards.length - 1) {
      disableButton(rightBtn);
    } else {
      enableButton(rightBtn);
    }
  }

  function updateDisplay() {
    const card = deck.cards[currentIndex];
    if (!card) return;
    cardTextEl.textContent = showingAnswer ? card.answer : card.question;

    // Title shows deck name and position
    titleEl.textContent = `${deck.name} · ${currentIndex + 1}/${deck.cards.length}`;

    // Apply BEM color modifier classes
    removeColorClasses(cardEl);
    if (showingAnswer) {
      cardEl.classList.add("carousel__card_color_white");
    } else if (deck.color) {
      const colorName = hexToString(deck.color);
      if (colorName) {
        cardEl.classList.add(`carousel__card_color_${colorName}`);
      }
    } else {
      cardEl.classList.add("carousel__card_color_green");
    }

    carouselEl.dataset.deckId = deck.id || "";
    updateArrows();
  }

  // Button handlers
  if (rightBtn) {
    rightBtn.addEventListener("click", () => {
      if (currentIndex < deck.cards.length - 1) {
        currentIndex++;
        showingAnswer = false;
        updateDisplay();
      }
    });
  }
  if (leftBtn) {
    leftBtn.addEventListener("click", () => {
      if (currentIndex > 0) {
        currentIndex--;
        showingAnswer = false;
        updateDisplay();
      }
    });
  }
  if (flipBtn) {
    flipBtn.addEventListener("click", () => {
      showingAnswer = !showingAnswer;
      updateDisplay();
    });
  }

  showView("carousel", { displayMode: "flex" });

  updateDisplay();
}

export { renderCarouselView };
