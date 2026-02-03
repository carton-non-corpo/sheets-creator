export interface Deck {
  name: string
  presence: number
}

export type MatchupWinRates = { [key: string]: { [key: string]: number } };
