import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Game } from '~~/common/types/games'
import type { Sheet, SheetContentCard } from '~~/common/types/sheet'
import type { EnhancedFile } from '~~/common/types/drive'

export const useSheetStore = defineStore('sheet', () => {
    const sheet = ref<Sheet | null>(null)

    // Initialize sheet if it doesn't exist
    function initializeSheet() {
        if (!sheet.value) {
            sheet.value = {
                id: crypto.randomUUID(),
                name: 'New Sheet',
                content: []
            }
        }
    }

    // Add or increment card quantity
    function addCard(card: EnhancedFile) {
        initializeSheet()

        if (!sheet.value) return

        const existingCardIndex = sheet.value.content.findIndex((c: SheetContentCard) => c.id === card.id)

        if (existingCardIndex >= 0) {
            // Card exists, increment quantity
            const existingCard = sheet.value.content[existingCardIndex]
            if (existingCard) {
                existingCard.quantity++
            }
        } else {
            // New card, add to the end
            const newCard: SheetContentCard = {
                ...card,
                quantity: 1
            }
            sheet.value.content.push(newCard)
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
