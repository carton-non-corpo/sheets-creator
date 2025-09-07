export enum Game {
  OPTCG = 'optcg',
  MTG = 'mtg',
  RIFTBOUND = 'riftbound',
}

export interface GameFolder {
  id: string; // https://drive.google.com/drive/folders/${folder_id}
  name: string;
  bleed: number; // In millimeter
  author: string;
  decklist: string;
}

export interface GameFoldersOPTCG extends GameFolder {
  subCategory: null;
  game: Game.OPTCG;
}

export interface GameFoldersMTG extends GameFolder {
  subCategory: "Tokens" | "Lands" | "Backs" | "Alternatives" | "Sideboard" | null;
  game: Game.MTG;
}

export interface GameFoldersRiftbound extends GameFolder {
  subCategory: null;
  game: Game.RIFTBOUND;
}

export type GameFolders = GameFoldersMTG | GameFoldersRiftbound | GameFoldersOPTCG;
