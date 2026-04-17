import type { Deck, MatchupWinRates } from '../types/tournament';

export interface PlayerEntry {
  deckName: string
  wins: number
  losses: number
  matchWinRate: number
  opponentsPlayed: string[]
}

export interface MatchResult {
  round: number
  player1: string
  player2: string
  winner: string
  winRate: number
}

export interface SwissRoundResults {
  standings: PlayerEntry[]
  matches: MatchResult[]
  totalRounds: number
}

/**
 * Converts a single-game win rate (%) into a BO3 match win rate (%).
 * Formula: p² · (3 − 2p) — probability of winning 2 games before the opponent does.
 */
function bo3MatchWinRate(gameWinRatePercent: number): number {
  const p = gameWinRatePercent / 100;
  return (p * p * (3 - 2 * p)) * 100;
}

/**
 * Simulates a Swiss-style tournament based on deck presence and matchup win rates
 */
export function simulateSwissTournament(
  decks: Deck[],
  matchupWinRates: MatchupWinRates,
  numberOfRounds: number = 10,
  playersPerDeck: number = 1024,
  bestOfThree: boolean = false,
): SwissRoundResults {
  // Generate player pool based on deck presence
  const players: PlayerEntry[] = [];

  decks.forEach(deck => {
    const count = Math.round((deck.presence / 100) * playersPerDeck);
    for (let i = 0; i < count; i++) {
      players.push({
        deckName: deck.name,
        wins: 0,
        losses: 0,
        matchWinRate: 0,
        opponentsPlayed: [],
      });
    }
  });

  const matches: MatchResult[] = [];

  // Simulate each round
  for (let round = 1; round <= numberOfRounds; round++) {
    // Group players by wins, then shuffle within each group
    const playersByWins = new Map<number, PlayerEntry[]>();

    players.forEach(player => {
      if (!playersByWins.has(player.wins)) {
        playersByWins.set(player.wins, []);
      }
      playersByWins.get(player.wins)!.push(player);
    });

    // Shuffle each group and combine
    const sortedPlayers: PlayerEntry[] = [];
    const winCounts = Array.from(playersByWins.keys()).sort((a, b) => b - a);

    winCounts.forEach(wins => {
      const group = playersByWins.get(wins)!;
      // Fisher-Yates shuffle
      for (let i = group.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [group[i]!, group[j]!] = [group[j]!, group[i]!];
      }
      sortedPlayers.push(...group);
    });

    const paired = new Set<number>();
    const roundMatches: [PlayerEntry, PlayerEntry][] = [];

    // Pair players with similar records
    for (let i = 0; i < sortedPlayers.length; i++) {
      if (paired.has(i)) continue;

      const player1 = sortedPlayers[i];
      let player2: PlayerEntry | null = null;
      let player2Index = -1;

      // Try to find opponent with similar record who hasn't been played yet and is a different deck
      for (let j = i + 1; j < sortedPlayers.length; j++) {
        if (paired.has(j)) continue;

        const candidate = sortedPlayers[j];
        if (!candidate || !player1) continue;

        const candidateOriginalIndex = players.indexOf(candidate);

        // Avoid mirror matches and players who have already played each other
        if (candidate.deckName !== player1.deckName &&
            !player1.opponentsPlayed.includes(`${candidateOriginalIndex}`)) {
          player2 = candidate;
          player2Index = j;
          break;
        }
      }

      // If no non-mirror opponent found, allow mirror match with first available unpaired player
      if (!player2) {
        for (let j = i + 1; j < sortedPlayers.length; j++) {
          if (!paired.has(j)) {
            const candidate = sortedPlayers[j];
            if (candidate) {
              player2 = candidate;
              player2Index = j;
              break;
            }
          }
        }
      }

      if (player2 && player1) {
        paired.add(i);
        paired.add(player2Index);
        roundMatches.push([player1, player2]);

        // Mark as played against each other
        const p1Index = players.indexOf(player1);
        const p2Index = players.indexOf(player2);
        player1.opponentsPlayed.push(`${p2Index}`);
        player2.opponentsPlayed.push(`${p1Index}`);
      }
    }

    // Simulate matches
    roundMatches.forEach(([player1, player2]) => {
      const gameWinRate = matchupWinRates[player1.deckName]?.[player2.deckName] ?? 50;
      const winRate = bestOfThree ? bo3MatchWinRate(gameWinRate) : gameWinRate;
      const player1Wins = Math.random() * 100 < winRate;

      if (player1Wins) {
        player1.wins++;
        player2.losses++;
      } else {
        player2.wins++;
        player1.losses++;
      }

      matches.push({
        round,
        player1: player1.deckName,
        player2: player2.deckName,
        winner: player1Wins ? player1.deckName : player2.deckName,
        winRate,
      });
    });
  }

  // Calculate final match win rates
  players.forEach(player => {
    const totalMatches = player.wins + player.losses;
    player.matchWinRate = totalMatches > 0 ? (player.wins / totalMatches) * 100 : 0;
  });

  // Sort final standings
  const standings = [...players].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.matchWinRate - a.matchWinRate;
  });

  return {
    standings,
    matches,
    totalRounds: numberOfRounds,
  };
}

/**
 * Aggregate results by deck type
 */
export function aggregateResultsByDeck(standings: PlayerEntry[]): Array<{
  deckName: string
  totalPlayers: number
  averageWins: number
  averageWinRate: number
  top32Count: number
  top64Count: number
  top128Count: number
  top256Count: number
}> {
  const deckStats = new Map<string, {
    totalPlayers: number
    totalWins: number
    totalWinRate: number
    positions: number[]
  }>();

  standings.forEach((player, index) => {
    if (!deckStats.has(player.deckName)) {
      deckStats.set(player.deckName, {
        totalPlayers: 0,
        totalWins: 0,
        totalWinRate: 0,
        positions: [],
      });
    }

    const stats = deckStats.get(player.deckName)!;
    stats.totalPlayers++;
    stats.totalWins += player.wins;
    stats.totalWinRate += player.matchWinRate;
    stats.positions.push(index);
  });

  return Array.from(deckStats.entries()).map(([deckName, stats]) => ({
    deckName,
    totalPlayers: stats.totalPlayers,
    averageWins: stats.totalWins / stats.totalPlayers,
    averageWinRate: stats.totalWinRate / stats.totalPlayers,
    top32Count: stats.positions.filter(p => p < 32).length,
    top64Count: stats.positions.filter(p => p < 64).length,
    top128Count: stats.positions.filter(p => p < 128).length,
    top256Count: stats.positions.filter(p => p < 256).length,
  })).sort((a, b) => b.totalPlayers - a.totalPlayers);
}
