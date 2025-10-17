

import type { CardSuggestion, DecklistImportPayload, DecklistImportResponse } from '~~/common/types/decklist-import';
import { Game } from '~~/common/types/games';
import { useGoogleDrive } from '../../composables/useGoogleDrive';
import { gameFolders } from '~~/common/utils/drives';

export default defineEventHandler(async (event): Promise<DecklistImportResponse> => {
  if (event.method !== 'POST') {
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

    console.log(`🃏 Processing ${suggestions.length} cards for game ${body.game}`);
    console.log(`📁 Using ${folderIds.length} folders:`, folderIds);

    if (folderIds.length === 0) {
      console.warn(`⚠️ No folders found for game ${body.game}`);
      return {
        success: true,
        suggestions: suggestions.map(card => ({ ...card, cards: [] })),
      };
    }

    // Initialize Google Drive once
    const { searchFiles } = useGoogleDrive();

    // Process cards with controlled concurrency to avoid overwhelming the API
    const batchSize = 3; // Process 3 cards at a time (reduced from 5)
    const results: CardSuggestion[] = [];

    for (let i = 0; i < suggestions.length; i += batchSize) {
      const batch = suggestions.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(suggestions.length / batchSize)} (cards ${i + 1}-${Math.min(i + batchSize, suggestions.length)})`);

      const batchPromises = batch.map(async (card, batchIndex) => {
        const globalIndex = i + batchIndex;
        try {
          console.log(`🔍 [${globalIndex + 1}/${suggestions.length}] Searching for card: "${card.name}"`);

          const searchResult = await searchFiles({
            query: card.name,
            folderIds: folderIds,
            includeImages: true,
            maxResults: 10, // Limit results per card to avoid overwhelming response
            orderBy: 'name',
          });

          console.log(`📊 [${globalIndex + 1}/${suggestions.length}] Search completed for "${card.name}"`);
          console.log('📊 Raw search result:', {
            filesCount: searchResult.files?.length || 0,
            totalFiles: searchResult.totalFiles,
            searchedFolders: searchResult.searchedFolders?.length || 0,
            queries: searchResult.queries?.length || 0,
          });

          // Filter and map the results to match EnhancedFile type
          const validFiles = (searchResult.files || [])
            .filter(file => {
              const isValid = file.id && file.name;
              if (!isValid) {
                console.warn(`⚠️ [${globalIndex + 1}/${suggestions.length}] Invalid file found for "${card.name}":`, { id: file.id, name: file.name });
              }
              return isValid;
            })
            .map(file => ({
              ...file,
              id: file.id!,
              name: file.name!,
            }));

          card.cards = validFiles;
          console.log(`✅ [${globalIndex + 1}/${suggestions.length}] Successfully processed "${card.name}" - ${card.cards.length} valid cards`);

          return card;

        } catch (error) {
          console.error(`❌ [${globalIndex + 1}/${suggestions.length}] Failed to search for card "${card.name}":`, error);
          console.error('❌ Error details:', {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : undefined,
            cause: error instanceof Error && 'cause' in error ? error.cause : undefined,
          });
          card.cards = [];
          return card;
        }
      });

      // Wait for this batch to complete before moving to the next
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add a longer delay between batches to avoid rate limiting
      if (i + batchSize < suggestions.length) {
        console.log('⏳ Waiting 1500ms before next batch...');
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    const totalFound = results.reduce((sum, card) => sum + card.cards.length, 0);
    console.log(`🎯 Search completed: ${totalFound} total cards found across ${results.length} suggestions`);

    return {
      success: true,
      suggestions: results,
    };
  } catch (error) {
    console.error('❌ Fatal error in decklist import:', error);
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
