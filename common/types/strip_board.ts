import type { EnhancedFile } from './drive'

export interface StripBoard {
  id: string;
  name: string;
  content: StripBoardContentCard[];
}

export interface StripBoardContentCard extends EnhancedFile {
  quantity: number;
}