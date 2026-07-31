export enum Game {
  OPTCG = 'optcg',
  MTG = 'mtg',
  RIFTBOUND = 'riftbound',
  FFTCG = 'fftcg',
  SORCERY = 'sorcery',
  CYBERPUNK_TCG = 'cyberpunk_tcg',
  NARUTO_TCG = 'naruto_tcg',
}

export enum SetOrigin {
  OFFICIAL = 'official',
  CUSTOM = 'custom',
  PROXY = 'proxy',
}

export interface GameFolder {
  id: string; // https://drive.google.com/drive/folders/${folder_id}
  name: string;
  bleed: number; // In millimeter
  author: string;
  decklist: string;
  origin: SetOrigin;
}

export interface GameFoldersOPTCG extends GameFolder {
  subCategory: null;
  game: Game.OPTCG;
}

export enum MTGSubCategory {
  FULL_DECK = 'Full Deck',
  DECK = 'Deck',
  TOKENS = 'Tokens',
  LANDS = 'Lands',
  BACKS = 'Backs',
  ALTERNATIVES = 'Alternatives',
  SIDEBOARD = 'Sideboard',
  SECRET_LAIR = 'Secret Lair',
}

export interface GameFoldersMTG extends GameFolder {
  subCategory: MTGSubCategory | null;
  game: Game.MTG;
}

export interface GameFoldersRiftbound extends GameFolder {
  subCategory: null;
  game: Game.RIFTBOUND;
}

export interface GameFoldersFFTCG extends GameFolder {
  subCategory: null;
  game: Game.FFTCG;
}

export interface GameFoldersSorcery extends GameFolder {
  subCategory: null;
  game: Game.SORCERY;
}

export interface GameFoldersCyberpunkTCG extends GameFolder {
  subCategory: null;
  game: Game.CYBERPUNK_TCG;
}

export interface GameFoldersNarutoTCG extends GameFolder {
  subCategory: null;
  game: Game.NARUTO_TCG;
}

export type GameFolders = GameFoldersMTG | GameFoldersRiftbound | GameFoldersOPTCG | GameFoldersFFTCG | GameFoldersSorcery | GameFoldersCyberpunkTCG | GameFoldersNarutoTCG;
