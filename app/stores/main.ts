import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMainStore = defineStore('main', () => {
  const selectedGame = ref<string>('optcg')
  const user = ref<null | { name: string }>(null)

  return {
    selectedGame,
    user,
  }
})
