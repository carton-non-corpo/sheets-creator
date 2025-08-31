import { useGoogleDrive } from '../../composables/useGoogleDrive';
import type { DriveSearchOptions } from '../../composables/useGoogleDrive';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const nameFilter = query.name as string;
  const foldersIds = query.foldersIds as string || '';

  try {
    const { searchFiles } = useGoogleDrive();

    // Parse folder IDs from query parameter (comma-separated string)
    let folderIds: string[] = [];
    if (foldersIds) {
      folderIds = foldersIds.split(',').map(id => id.trim()).filter(Boolean);
    }

    // Fallback to default folder if none provided
    const config = useRuntimeConfig();
    if (folderIds.length === 0 && config.googleDriveFolderId) {
      folderIds = [config.googleDriveFolderId];
    }

    // Build search options
    const searchOptions: DriveSearchOptions = {
      query: nameFilter,
      folderIds: folderIds.length > 0 ? folderIds : undefined,
      includeImages: true,
      maxResults: 1000,
      orderBy: 'name',
    };

    // Search for files
    const result = await searchFiles(searchOptions);

    return {
      files: result.files,
      searchedFolders: result.searchedFolders,
      queries: result.queries,
      totalFiles: result.totalFiles,
    };

  } catch (error: any) {
    console.error('❌ Drive API error:', error);

    // Handle specific error types
    if (error.name === 'GoogleDriveAuthError') {
      throw createError({
        statusCode: 401,
        statusMessage: 'Google Drive authentication failed',
      });
    }

    if (error.name === 'GoogleDriveRateLimitError') {
      throw createError({
        statusCode: 429,
        statusMessage: 'Rate limit exceeded. Please try again later.',
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to search Google Drive files',
    });
  }
});
