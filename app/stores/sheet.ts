import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Sheet, SheetContentCard, SheetPage } from '~~/common/types/sheet';
import type { EnhancedFile } from '~~/common/types/drive';
import { CardFormat, type GameFolders } from '~~/common/types/games';
import { gameFolders } from '~~/common/utils/drives';
import { getCardsPerPage } from '~~/common/utils/card-formats';

export const useSheetStore = defineStore('sheet', () => {
  const sheet = ref<Sheet | null>(null);

  // Get the folder a card comes from, its bleed and format are inherited from it
  function getCardFolder(card: EnhancedFile): GameFolders | undefined {
    if (!card.parents || card.parents.length === 0) {
      console.warn(`Card ${card.name} has no parent folders`);
      return undefined;
    }

    // Find the folder that matches one of the card's parents
    const cardFolder = gameFolders.find(folder =>
      card.parents?.includes(folder.id),
    );

    if (!cardFolder) {
      console.warn(`No folder found for card ${card.name} with parents:`, card.parents);
    }

    return cardFolder;
  }

  // Initialize sheet if it doesn't exist
  function initializeSheet() {
    if (!sheet.value) {
      sheet.value = {
        id: crypto.randomUUID(),
        name: 'New Sheet',
        content: [],
        bleed: 0, // Will be set based on first card
      };
    }
  }

  // Find the right position to insert a card based on bleed and format
  function findInsertPosition(content: SheetContentCard[], cardBleed: number, cardFormat: CardFormat): number {
    // Find the last card with the same bleed and format
    let insertPosition = content.length;
    for (let i = content.length - 1; i >= 0; i--) {
      const card = content[i];
      if (card && card.bleed === cardBleed && card.format === cardFormat) {
        insertPosition = i + 1;
        break;
      }
    }
    return insertPosition;
  }

  // Add or increment card quantity
  function addCard(card: EnhancedFile) {
    initializeSheet();

    if (!sheet.value) return;

    const cardFolder = getCardFolder(card);
    const cardBleed = cardFolder?.bleed ?? 0;
    const cardFormat = cardFolder?.format ?? CardFormat.STANDARD;

    // Set sheet bleed to first card's bleed if sheet is empty
    if (sheet.value.content.length === 0) {
      sheet.value.bleed = cardBleed;
    }

    const existingCardIndex = sheet.value.content.findIndex((c: SheetContentCard) => c.id === card.id);

    if (existingCardIndex >= 0) {
      // Card exists, increment quantity
      const existingCard = sheet.value.content[existingCardIndex];
      if (existingCard) {
        existingCard.quantity++;
      }
    } else {
      // New card, find the right position based on bleed and format
      const insertPosition = findInsertPosition(sheet.value.content, cardBleed, cardFormat);
      const newCard: SheetContentCard = {
        ...card,
        quantity: 1,
        bleed: cardBleed,
        format: cardFormat,
      };
      sheet.value.content.splice(insertPosition, 0, newCard);
    }
  }

  // Remove or decrement card quantity
  function removeCard(cardId: string) {
    if (!sheet.value) return;

    const existingCardIndex = sheet.value.content.findIndex((c: SheetContentCard) => c.id === cardId);

    if (existingCardIndex >= 0) {
      const card = sheet.value.content[existingCardIndex];

      if (card && card.quantity > 1) {
        // Decrement quantity
        card.quantity--;
      } else {
        // Remove card from content list
        sheet.value.content.splice(existingCardIndex, 1);
      }
    }
  }

  // Get quantity for a specific card
  function getCardQuantity(cardId: string): number {
    if (!sheet.value) return 0;

    const card = sheet.value.content.find((c: SheetContentCard) => c.id === cardId);
    return card?.quantity || 0;
  }

  // Split cards into printable pages, a new page starts when the page is full or when bleed or format changes
  const pages = computed<SheetPage[]>(() => {
    if (!sheet.value) return [];

    const result: SheetPage[] = [];
    let printIndex = 0;

    for (const card of sheet.value.content) {
      for (let i = 0; i < card.quantity; i++) {
        let page = result.at(-1);
        if (!page || page.bleed !== card.bleed || page.format !== card.format || page.cards.length >= getCardsPerPage(card.format)) {
          page = { pageNumber: result.length + 1, cards: [], bleed: card.bleed, format: card.format };
          result.push(page);
        }
        page.cards.push({ ...card, printIndex: printIndex++ });
      }
    }

    return result;
  });

  return {
    sheet,
    pages,
    addCard,
    removeCard,
    getCardQuantity,
    initializeSheet,
  };
});
