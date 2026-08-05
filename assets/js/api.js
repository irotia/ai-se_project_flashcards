const baseUrl = "https://se-flashcards-api.en.tripleten-services.com/v1";
const headers = {
  "Content-Type": "application/json",
  Authorization: "019fd3e3-4730-768f-96a5-ef71d499b775",
};

/**
 * Converts a fetch Response object into JSON or text, and rejects on HTTP errors.
 *
 * @param {Response} res - The fetch response to parse.
 * @returns {Promise<unknown|string|null>} Parsed response payload.
 */
function processResponse(res) {
  if (res.ok) {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return res.text().then((text) => (text ? JSON.parse(text) : null));
    }
    return res.text().then((text) => (text ? text : null));
  }
  return Promise.reject(`Error: ${res.status}`);
}

/**
 * Fetches all decks from the API.
 *
 * @returns {Promise<Array<object>>} A promise resolving to the deck list.
 */
function getDecks() {
  return fetch(`${baseUrl}/decks`, { headers }).then(processResponse);
}

/**
 * Deletes a deck by its API identifier.
 *
 * @param {string} deckId - The deck identifier.
 * @returns {Promise<unknown|string|null>} API response payload.
 */
function deleteDeck(deckId) {
  return fetch(`${baseUrl}/decks/${deckId}`, {
    method: "DELETE",
    headers,
  }).then(processResponse);
}

/**
 * Creates a new deck in the API.
 *
 * @param {{name: string, color: string, cards: Array<object>}} deckData - Deck data payload.
 * @returns {Promise<object>} A promise resolving to the created deck.
 */
function addDeck(deckData) {
  return fetch(`${baseUrl}/decks`, {
    method: "POST",
    headers,
    body: JSON.stringify(deckData),
  }).then(processResponse);
}

export { addDeck, deleteDeck, getDecks };
