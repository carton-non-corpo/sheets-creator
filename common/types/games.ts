export enum Game {
  OPTCG = 'optcg',
  MTG = 'mtg',
  RIFTBOUND = 'riftbound',
}

export interface GameFolders {
  id: string; // https://drive.google.com/drive/folders/${folder_id}
  name: string;
  bleed: boolean;
  game: Game;
}
