import { Game } from "../types/games";

export function getGameDisplayName(game: Game): string {
  switch (game) {
    case Game.OPTCG:
      return 'One Piece Card Game';
    case Game.MTG:
      return 'Magic: The Gathering';
    case Game.RIFTBOUND:
      return 'Riftbound';
    default:
      return 'Unknown Game';
  }
}
