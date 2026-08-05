import { fetchedDecks } from "./decks.js";

const newDeckForm = document.querySelector("#new-deck-form");
const HEX_DIGITS = /^[0-9a-fA-F]{6}$/;
const newDeckErrorModal = document.querySelector("#new-deck-error-modal");
const newDeckErrorList = document.querySelector("#new-deck-error-list");
const newDeckErrorCloseBtn = document.querySelector(
  ".new-deck-view__error-modal-close-btn",
);
const COLOR_OPTIONS = Array.from(
  document.querySelectorAll(".new-deck-view__color-input"),
)
  .map((input) => input.value)
  .filter(Boolean);
const COLOR_OPTIONS_LOWER = COLOR_OPTIONS.map((value) => value.toLowerCase());

function disableSubmitBtn() {
  const newDeckSubmitBtn = newDeckForm?.querySelector(
    ".new-deck-view__submit-btn",
  );
  const newDeckTextInput = newDeckForm?.querySelector(
    ".new-deck-view__text-input",
  );

  if (!newDeckSubmitBtn || !newDeckTextInput) return;

  const hasText = newDeckTextInput.value.trim().length > 0;
  const hasColorSelected = Boolean(
    newDeckForm.querySelector(".new-deck-view__color-input:checked"),
  );

  newDeckSubmitBtn.disabled = !(hasText && hasColorSelected);
}

function showNewDeckErrorModal(messages) {
  if (!newDeckErrorModal || !newDeckErrorList) return;

  newDeckErrorList.textContent = "";
  messages.forEach((message) => {
    const item = document.createElement("li");
    item.textContent = message;
    newDeckErrorList.append(item);
  });

  newDeckErrorModal.classList.remove("hidden");
}

function hideNewDeckErrorModal() {
  if (!newDeckErrorModal) return;
  newDeckErrorModal.classList.add("hidden");
}

function validateDeckJsonPayload(deckPayload) {
  const errors = [];

  if (
    !deckPayload ||
    Array.isArray(deckPayload) ||
    typeof deckPayload !== "object"
  ) {
    return ["The JSON root must be an object with a name and cards field."];
  }

  if (typeof deckPayload.name !== "string") {
    errors.push(
      'The "name" field is required and must be a string between 4 and 24 characters in length.',
    );
  } else {
    const trimmedName = deckPayload.name.trim();
    if (trimmedName.length < 4 || trimmedName.length > 24) {
      errors.push(
        'The "name" field is required and must be a string between 4 and 24 characters in length.',
      );
    }
  }

  if (!Array.isArray(deckPayload.cards)) {
    errors.push('The "cards" field is required and must be an array.');
  } else if (deckPayload.cards.length === 0) {
    errors.push('The "cards" array must include at least one card.');
  }

  if (deckPayload.color !== undefined) {
    if (typeof deckPayload.color !== "string") {
      errors.push(`Invalid card color use one of: ${COLOR_OPTIONS.join(", ")}`);
    } else {
      const normalizedColor = deckPayload.color.startsWith("#")
        ? deckPayload.color.toLowerCase()
        : `#${deckPayload.color.toLowerCase()}`;

      if (!COLOR_OPTIONS_LOWER.includes(normalizedColor)) {
        errors.push(
          `Invalid card color use one of: ${COLOR_OPTIONS.join(", ")}`,
        );
      }
    }
  }

  return errors;
}

/**
 * Converts a string to a URL-safe slug: lowercase with any run of
 * non-alphanumeric characters replaced by a single hyphen, and no leading or
 * trailing hyphens.
 *
 * @param {string} str
 * @returns {string}
 */
function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Returns a consistent lowercase hex color string with a leading "#".
 * Accepts values with or without a leading "#". Returns "#64d583" as a
 * fallback if the value is missing or not a valid 6-digit hex.
 *
 * @param {string|undefined} color
 * @returns {string}
 */
function normalizeColor(color) {
  if (!color) return "#64d583";
  const hex = color.startsWith("#") ? color.slice(1) : color;
  if (!HEX_DIGITS.test(hex)) return "#64d583";
  return "#" + hex.toLowerCase();
}

if (newDeckForm) {
  const newDeckTextInput = newDeckForm.querySelector(
    ".new-deck-view__text-input",
  );
  const colorInputs = Array.from(
    newDeckForm.querySelectorAll(".new-deck-view__color-input"),
  );

  newDeckTextInput?.addEventListener("input", disableSubmitBtn);
  colorInputs.forEach((input) =>
    input.addEventListener("change", disableSubmitBtn),
  );
  newDeckErrorCloseBtn?.addEventListener("click", hideNewDeckErrorModal);
  newDeckErrorModal?.addEventListener("click", (event) => {
    if (event.target === newDeckErrorModal) {
      hideNewDeckErrorModal();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hideNewDeckErrorModal();
    }
  });

  disableSubmitBtn();

  newDeckForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(newDeckForm);
    const formValues = Object.fromEntries(formData.entries());
    let jsonData;

    try {
      jsonData = JSON.parse(newDeckTextInput?.value ?? "");
    } catch {
      showNewDeckErrorModal([
        "The JSON is malformed. Please fix the syntax and try again.",
      ]);
      return;
    }

    const validationErrors = validateDeckJsonPayload(jsonData);
    if (validationErrors.length > 0) {
      showNewDeckErrorModal(validationErrors);
      return;
    }

    const color = jsonData.color
      ? (jsonData.color.startsWith("#")
          ? jsonData.color
          : `#${jsonData.color}`
        ).toLowerCase()
      : normalizeColor(formValues.color);
    const name = jsonData.name.trim();
    const _id = `${slugify(name)}-${Date.now()}`;

    fetchedDecks.push({
      _id,
      color,
      name,
      cards: jsonData.cards,
    });

    window.location.hash = `deck/${_id}`;
  });
}
