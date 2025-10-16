import type { EnhancedFile } from './drive';
import type { Game } from './games';

export interface DecklistImportPayload {
  game: Game
  decklist: string
}

export interface DecklistImportResponse {
  success: boolean
  suggestions: CardSuggestion[]
}

export interface CardSuggestion {
  name: string
  quantity: number
  cards: EnhancedFile[]
}
