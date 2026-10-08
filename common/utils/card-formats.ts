import { CardFormat } from '../types/games';

export interface CardFormatLayout {
  cardWidth: number; // In millimeters, without bleed
  cardHeight: number; // In millimeters, without bleed
  columns: number;
  rows: number;
  pageWidth: number; // In millimeters
  pageHeight: number; // In millimeters
}

export const CARD_FORMAT_LAYOUTS: Record<CardFormat, CardFormatLayout> = {
  // A4 portrait, 3x3 grid
  [CardFormat.STANDARD]: { cardWidth: 63, cardHeight: 88, columns: 3, rows: 3, pageWidth: 210, pageHeight: 297 },
  // A4 landscape, 4x2 grid
  [CardFormat.ARTWORK]: { cardWidth: 69, cardHeight: 94, columns: 4, rows: 2, pageWidth: 297, pageHeight: 210 },
};

export function getCardsPerPage(format: CardFormat): number {
  const { columns, rows } = CARD_FORMAT_LAYOUTS[format];
  return columns * rows;
}

export function getLandmarksUrl(format: CardFormat, bleed: number): string {
  if (format === CardFormat.ARTWORK) return '/landmarks-artwork.svg';
  return bleed === 1 ? '/landmarks-bleed-1mm.svg' : '/landmarks-bleed-0mm.svg';
}
