

import type { CardSuggestion, DecklistImportPayload, DecklistImportResponse } from '~~/common/types/decklist-import';
import { Game } from '~~/common/types/games';
import { useGoogleDrive } from '../../composables/useGoogleDrive';
import { gameFolders } from '~~/common/utils/drives';

export default defineEventHandler(async (event): Promise<DecklistImportResponse> => {
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed',
    });
  }

  const body = await readBody(event) as DecklistImportPayload;

  if (!body.game || !body.decklist) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing game or decklist',
    });
  }

  try {
    const suggestions: CardSuggestion[] = await parseDecklist(body.game, body.decklist);
    const folderIds = gameFolders.filter(folder => folder.game === body.game).map(folder => folder.id);

    // Initialize Google Drive once
    const { searchFiles } = useGoogleDrive();

    // Parallelize search queries for all cards
    const searchPromises = suggestions.map(async card => {
      try {
        const searchResult = await searchFiles({
          query: card.name,
          folderIds: folderIds,
          includeImages: true,
          maxResults: 10, // Limit results per card to avoid overwhelming response
          orderBy: 'name',
        });

        console.log('GUILLAUME', searchResult);

        // Filter and map the results to match EnhancedFile type
        card.cards = (searchResult.files || [])
          .filter(file => file.id && file.name)
          .map(file => ({
            ...file,
            id: file.id!,
            name: file.name!,
          }));

      } catch (error) {
        console.error(`Failed to search for card "${card.name}":`, error);
        card.cards = [];
      }
    });

    // Wait for all searches to complete
    await Promise.all(searchPromises);

    return {
      success: true,
      suggestions,
    };
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to parse decklist',
    });
  }
});

async function parseDecklist(game: Game, decklist: string): Promise<CardSuggestion[]> {
  switch (game) {
  case Game.OPTCG:
    return parseOPTCGDecklist(decklist);
  case Game.RIFTBOUND:
    return parseRiftboundDecklist(decklist);
  default:
    throw new Error(`Unsupported game: ${game}`);
  }
}

function parseOPTCGDecklist(decklist: string): CardSuggestion[] {
  const suggestions: CardSuggestion[] = [];
  const lines = decklist.split('\n').filter(line => line.trim());

  for (const line of lines) {
    // Parse OPTCG format: "1xOP13-079" or "4 EB02-036"
    const match = line.match(/^(\d+)x?(.+)$/);
    if (match) {
      const quantity = parseInt(match[1], 10);
      const cardId = match[2].trim();

      suggestions.push({
        name: cardId,
        quantity,
        cards: [],
      });
    }
  }

  return suggestions;
}

function parseRiftboundDecklist(decklist: string): CardSuggestion[] {
  const suggestions: CardSuggestion[] = [];
  const lines = decklist.split('\n').filter(line => line.trim());

  for (const line of lines) {
    // Parse Riftbound format: "4 Card Name"
    const match = line.match(/^(\d+)\s+(.+)$/);
    if (match) {
      const quantity = parseInt(match[1], 10);
      const cardName = match[2].trim();

      suggestions.push({
        name: cardName,
        quantity,
        cards: [],
      });
    }
  }

  return suggestions;
}
