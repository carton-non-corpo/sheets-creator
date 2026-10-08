import type { EnhancedFile } from './drive';
import type { CardFormat } from './games';

export interface Sheet {
  id: string;
  name: string;
  content: SheetContentCard[];
  bleed: number; // In millimeters
}

export interface SheetContentCard extends EnhancedFile {
  quantity: number;
  bleed: number; // In millimeters, inherited from parent folder
  format: CardFormat; // Inherited from parent folder
}

export interface SheetPage {
  pageNumber: number;
  cards: Array<SheetContentCard & { printIndex: number }>;
  bleed: number; // In millimeters
  format: CardFormat;
}
