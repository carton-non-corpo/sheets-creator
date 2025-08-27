import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Game } from '~~/common/types/games'
import type { StripBoard, StripBoardContentCard } from '~~/common/types/strip_board'
import type { EnhancedFile } from '~~/common/types/drive'

export const useStripBoardStore = defineStore('strip-board', () => {
  const stripBoard = ref<StripBoard | null>(null)

  // Initialize strip board if it doesn't exist
  function initializeStripBoard() {
    if (!stripBoard.value) {
      stripBoard.value = {
        id: crypto.randomUUID(),
        name: 'New Strip Board',
        content: []
      }
    }
  }

  // Add or increment card quantity
  function addCard(card: EnhancedFile) {
    initializeStripBoard()

    if (!stripBoard.value) return

    const existingCardIndex = stripBoard.value.content.findIndex(c => c.id === card.id)

    if (existingCardIndex >= 0) {
      // Card exists, increment quantity
      const existingCard = stripBoard.value.content[existingCardIndex]
      if (existingCard) {
        existingCard.quantity++
      }
    } else {
      // New card, add to the end
      const newCard: StripBoardContentCard = {
        ...card,
        quantity: 1
      }
      stripBoard.value.content.push(newCard)
    }
  }

  // Remove or decrement card quantity
  function removeCard(cardId: string) {
    if (!stripBoard.value) return

    const existingCardIndex = stripBoard.value.content.findIndex(c => c.id === cardId)

    if (existingCardIndex >= 0) {
      const card = stripBoard.value.content[existingCardIndex]

      if (card && card.quantity > 1) {
        // Decrement quantity
        card.quantity--
      } else {
        // Remove card from content list
        stripBoard.value.content.splice(existingCardIndex, 1)
      }
    }
  }

  // Get quantity for a specific card
  function getCardQuantity(cardId: string): number {
    if (!stripBoard.value) return 0

    const card = stripBoard.value.content.find(c => c.id === cardId)
    return card?.quantity || 0
  }

  return {
    stripBoard,
    addCard,
    removeCard,
    getCardQuantity,
    initializeStripBoard
  }
})
