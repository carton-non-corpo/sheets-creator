import type { Sheet, SheetContentCard } from '~~/common/types/sheet';
import type { EnhancedFile } from '~~/common/types/drive';
import { gameFolders } from '~~/common/utils/drives';


export const useDeckStore = defineStore('deck', () => {
  const decks: Ref<Sheet[]> = ref([]);
  const focussedDeck: Ref<Sheet | undefined> = ref(undefined);
  const loading: Ref<boolean> = ref(false);
  const STORAGE_KEY = 'sheets-creator-decks';

  /**
   * Fetches Decks data inside of user's browser
   */
  async function fetchDecks() {
    loading.value = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        decks.value = JSON.parse(raw);
      } else {
        decks.value = [];
      }
    } catch {
      decks.value = [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Creates a deck and display it as focussedDeck
   */
  function createDeck() {
    const id = Math.random().toString(36).slice(2, 10);
    const newDecksAmount = decks.value.filter(d => d.name.match(/^New Deck( \(\d+\))?$/)).length;
    const newDeck: Sheet = {
      id,
      name: newDecksAmount === 0 ? 'New Deck' : `New Deck (${newDecksAmount + 1})`,
      content: [],
      bleed: 0,
    };
    decks.value.push(newDeck);
    focussedDeck.value = newDeck;
    saveDecks();
  }

  /**
   * Updates a deck and saves it in the user's browser
   */
  function updateDeck(updated: Sheet) {
    const idx = decks.value.findIndex(d => d.id === updated.id);
    if (idx !== -1) {
      decks.value[idx] = { ...updated };
      saveDecks();
    }
  }

  /**
   * Deletes a deck from the user's browser and sets focussedDeck to undefined if id matches
   */
  function deleteDeck(id: string) {
    decks.value = decks.value.filter(d => d.id !== id);
    if (focussedDeck.value?.id === id) {
      focussedDeck.value = undefined;
    }
    saveDecks();
  }

  /**
   * Focusses deck via id, if id already exists unfocus
   */
  function focusDeck(id: string) {
    const deck = decks.value.find((d: Sheet) => d.id === id);
    if (deck) {
      focussedDeck.value = deck;
    } else {
      focussedDeck.value = undefined;
    }
  }

  function saveDecks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks.value));
  }

  // Get the bleed value for a card based on its parent folder
  function getCardBleed(card: EnhancedFile): number {
    if (!card.parents || card.parents.length === 0) {
      console.warn(`Card ${card.name} has no parent folders`);
      return 0; // Default bleed if no parent folder found
    }

    // Find the folder that matches one of the card's parents
    const cardFolder = gameFolders.find(folder =>
      card.parents?.includes(folder.id),
    );

    if (!cardFolder) {
      console.warn(`No folder found for card ${card.name} with parents:`, card.parents);
      return 0; // Default bleed if folder not found
    }

    return cardFolder.bleed;
  }

  // Find the right position to insert a card based on bleed value
  function findInsertPosition(content: SheetContentCard[], cardBleed: number): number {
    // Find the last card with the same bleed value
    let insertPosition = content.length;
    for (let i = content.length - 1; i >= 0; i--) {
      const card = content[i];
      if (card && card.bleed === cardBleed) {
        insertPosition = i + 1;
        break;
      }
    }
    return insertPosition;
  }

  // Add or increment card quantity to focused deck
  function addCard(card: EnhancedFile) {
    if (!focussedDeck.value) return;

    const cardBleed = getCardBleed(card);

    // Set deck bleed to first card's bleed if deck is empty
    if (focussedDeck.value.content.length === 0) {
      focussedDeck.value.bleed = cardBleed;
    }

    const existingCardIndex = focussedDeck.value.content.findIndex((c: SheetContentCard) => c.id === card.id);

    if (existingCardIndex >= 0) {
      // Card exists, increment quantity
      const existingCard = focussedDeck.value.content[existingCardIndex];
      if (existingCard) {
        existingCard.quantity++;
      }
    } else {
      // New card, find the right position based on bleed
      const insertPosition = findInsertPosition(focussedDeck.value.content, cardBleed);
      const newCard: SheetContentCard = {
        ...card,
        quantity: 1,
        bleed: cardBleed,
      };
      focussedDeck.value.content.splice(insertPosition, 0, newCard);
    }

    // Update the deck in the store
    updateDeck(focussedDeck.value);
  }

  // Remove or decrement card quantity from focused deck
  function removeCard(cardId: string) {
    if (!focussedDeck.value) return;

    const existingCardIndex = focussedDeck.value.content.findIndex((c: SheetContentCard) => c.id === cardId);

    if (existingCardIndex >= 0) {
      const card = focussedDeck.value.content[existingCardIndex];

      if (card && card.quantity > 1) {
        // Decrement quantity
        card.quantity--;
      } else {
        // Remove card from content list
        focussedDeck.value.content.splice(existingCardIndex, 1);
      }

      // Update the deck in the store
      updateDeck(focussedDeck.value);
    }
  }

  // Get quantity for a specific card in focused deck
  function getCardQuantity(cardId: string): number {
    if (!focussedDeck.value) return 0;

    const card = focussedDeck.value.content.find((c: SheetContentCard) => c.id === cardId);
    return card?.quantity || 0;
  }

  onMounted(fetchDecks);

  // Public API
  return {
    decks,
    focussedDeck,
    loading,

    createDeck,
    updateDeck,
    deleteDeck,
    focusDeck,
    addCard,
    removeCard,
    getCardQuantity,
  };
});
