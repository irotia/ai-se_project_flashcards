import { decks } from "./decks.js";

const newDeckForm = document.querySelector("#new-deck-form");
const HEX_DIGITS = /^[0-9a-fA-F]{6}$/;

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
  disableSubmitBtn();

  newDeckForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(newDeckForm);
    const formValues = Object.fromEntries(formData.entries());
    const jsonData = JSON.parse(newDeckTextInput?.value ?? "");
    const color = normalizeColor(formValues.color);
    const name = String(formValues.name || jsonData.name || "New Deck");
    const id = `${slugify(name)}-${Date.now()}`;

    decks.push({
      id,
      color,
      name,
      cards: jsonData.cards ?? [],
    });

    window.location.hash = `deck/${id}`;
  });
}
