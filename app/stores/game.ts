import { defineStore } from 'pinia';
import { computed } from 'vue';
import { Game } from '~~/common/types/games';
import { gameFolders } from '~~/common/utils/drives';

export const useGameStore = defineStore('game', () => {
  // Use cookie for SSR-safe persistence without blink
  const selectedGameCookie = useCookie<Game>('selectedGame', {
    default: () => Game.MTG,
  });

  const selectedGame = computed({
    get: () => selectedGameCookie.value,
    set: (value: Game) => {
      selectedGameCookie.value = value;
    },
  });

  const currentGameFolders = computed(() => {
    return gameFolders.filter(folder => folder.game === selectedGame.value);
  });

  return {
    selectedGame,
    currentGameFolders,
  };
});
