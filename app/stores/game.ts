import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Game } from '~~/common/types/games'
import { gameFolders } from '~~/common/utils/drives'

export const useGameStore = defineStore('game', () => {
  const selectedGame = ref<Game>(Game.MTG)

  const currentGameFolders = computed(() => {
    return gameFolders.filter(folder => folder.game === selectedGame.value)
  })

  return {
    selectedGame,
    currentGameFolders
  }
})
