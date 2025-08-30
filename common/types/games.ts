export enum Game {
  OPTCG = 'optcg',
  MTG = 'mtg',
  RIFTBOUND = 'riftbound',
}

export interface GameFoldersOPTCG {
  id: string; // https://drive.google.com/drive/folders/${folder_id}
  name: string;
  bleed: boolean;
  subCategory: "Alternatives" | "Sideboard" | null;
  game: Game.OPTCG;
}

export interface GameFoldersMTG {
  id: string; // https://drive.google.com/drive/folders/${folder_id}
  name: string;
  bleed: boolean;
  subCategory: "Tokens" | "Lands" | "Backs" | "Alternatives" | "Sideboard" | null;
  game: Game.MTG;
}

export interface GameFoldersRiftbound {
  id: string; // https://drive.google.com/drive/folders/${folder_id}
  name: string;
  bleed: boolean;
  subCategory: "Alternatives" | "Sideboard" | null;
  game: Game.RIFTBOUND;
}

export type GameFolders = GameFoldersMTG | GameFoldersRiftbound | GameFoldersOPTCG;
