import { Game } from '../types/games';

export const DECKLIST_SUPPORTED_GAMES: readonly Game[] = [Game.OPTCG, Game.RIFTBOUND];

export function getGameDisplayName(game: Game): string {
  switch (game) {
  case Game.OPTCG:
    return 'One Piece Card Game';
  case Game.MTG:
    return 'Magic: The Gathering';
  case Game.RIFTBOUND:
    return 'Riftbound';
  case Game.FFTCG:
    return 'Final Fantasy TCG';
  case Game.SORCERY:
    return 'Sorcery TCG';
  case Game.CYBERPUNK_TCG:
    return 'Cyberpunk TCG';
  default: {
    const exhaustiveCheck: never = game;
    throw new Error(`Unhandled game in getGameDisplayName: ${exhaustiveCheck}`);
  }
  }
}
