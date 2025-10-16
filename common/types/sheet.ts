import type { EnhancedFile } from './drive';

export interface Sheet {
  id: string;
  name: string;
  content: SheetContentCard[];
  bleed: number; // In millimeters
}

export interface SheetContentCard extends EnhancedFile {
  quantity: number;
  bleed: number; // In millimeters, inherited from parent folder
}
