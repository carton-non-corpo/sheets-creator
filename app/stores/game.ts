import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Game } from '~~/common/types/games'

export const useGameStore = defineStore('game', () => {
  const selectedGame = ref<Game>(Game.MTG)

  return {
    selectedGame,
  }
})
