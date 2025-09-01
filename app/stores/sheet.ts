import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Game } from '~~/common/types/games'
import type { Sheet, SheetContentCard } from '~~/common/types/sheet'
import type { EnhancedFile } from '~~/common/types/drive'
import { gameFolders } from '~~/common/utils/drives'

export const useSheetStore = defineStore('sheet', () => {
  const sheet = ref<Sheet | null>(null)

  // Get the bleed value for a card based on its parent folder
  function getCardBleed(card: EnhancedFile): number {
    if (!card.parents || card.parents.length === 0) {
      console.warn(`Card ${card.name} has no parent folders`)
      return 0 // Default bleed if no parent folder found
    }

    // Find the folder that matches one of the card's parents
    const cardFolder = gameFolders.find(folder =>
      card.parents?.includes(folder.id)
    )

    if (!cardFolder) {
      console.warn(`No folder found for card ${card.name} with parents:`, card.parents)
      return 0 // Default bleed if folder not found
    }

    return cardFolder.bleed
  }

  // Initialize sheet if it doesn't exist
  function initializeSheet() {
    if (!sheet.value) {
      sheet.value = {
        id: crypto.randomUUID(),
        name: 'New Sheet',
        content: [],
        bleed: 0 // Will be set based on first card
      }
    }
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

  // Add or increment card quantity
  function addCard(card: EnhancedFile) {
    initializeSheet()

    if (!sheet.value) return

    const cardBleed = getCardBleed(card)

    // Set sheet bleed to first card's bleed if sheet is empty
    if (sheet.value.content.length === 0) {
      sheet.value.bleed = cardBleed
    }

    const existingCardIndex = sheet.value.content.findIndex((c: SheetContentCard) => c.id === card.id)

    if (existingCardIndex >= 0) {
      // Card exists, increment quantity
      const existingCard = sheet.value.content[existingCardIndex]
      if (existingCard) {
        existingCard.quantity++
      }
    } else {
      // New card, find the right position based on bleed
      const insertPosition = findInsertPosition(sheet.value.content, cardBleed)
      const newCard: SheetContentCard = {
        ...card,
        quantity: 1,
        bleed: cardBleed
      }
      sheet.value.content.splice(insertPosition, 0, newCard)
    }
  }

  // Remove or decrement card quantity
  function removeCard(cardId: string) {
    if (!sheet.value) return

    const existingCardIndex = sheet.value.content.findIndex((c: SheetContentCard) => c.id === cardId)

    if (existingCardIndex >= 0) {
      const card = sheet.value.content[existingCardIndex]

      if (card && card.quantity > 1) {
        // Decrement quantity
        card.quantity--
      } else {
        // Remove card from content list
        sheet.value.content.splice(existingCardIndex, 1)
      }
    }
  }

  // Get quantity for a specific card
  function getCardQuantity(cardId: string): number {
    if (!sheet.value) return 0

    const card = sheet.value.content.find((c: SheetContentCard) => c.id === cardId)
    return card?.quantity || 0
  }

  return {
    sheet,
    addCard,
    removeCard,
    getCardQuantity,
    initializeSheet
  }
})
