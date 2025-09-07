import { defineStore } from 'pinia'

export const useCardStore = defineStore('card', () => {
  const openDetailsCardImageUrl: Ref<string | undefined> = ref(undefined)

  function openCardDetails(cardId: string) {
    openDetailsCardImageUrl.value = cardId
  }

  function closeCardDetails() {
    openDetailsCardImageUrl.value = undefined
  }

  return {
    openCardDetails,
    closeCardDetails,
    openDetailsCardImageUrl
  }
})
