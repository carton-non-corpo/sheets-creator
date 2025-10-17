import { useGoogleDrive } from '../../composables/useGoogleDrive';
import type { DriveSearchOptions } from '../../composables/useGoogleDrive';

export default defineEventHandler(async event => {
  const query = getQuery(event);
  const nameFilter = query.name as string;
  const folderIds = query.folderIds as string || '';

  try {
    const { searchFiles } = useGoogleDrive();

    // Parse folder IDs from query parameter (comma-separated string)
    let toSearchFolderIds: string[] = [];
    if (folderIds) {
      toSearchFolderIds = folderIds.split(',').map(id => id.trim()).filter(Boolean);
    }

    // Remove duplicates
    toSearchFolderIds = [...new Set(toSearchFolderIds)];

    // Fallback to default folder if none provided
    const config = useRuntimeConfig();
    if (toSearchFolderIds.length === 0 && config.googleDriveFolderId) {
      toSearchFolderIds = [config.googleDriveFolderId];
    }

    // Build search options
    const searchOptions: DriveSearchOptions = {
      query: nameFilter,
      folderIds: toSearchFolderIds.length > 0 ? toSearchFolderIds : undefined,
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

  } catch (error: unknown) {
    console.error('❌ Drive API error:', error);

    // Handle specific error types
    if (error && typeof error === 'object' && 'name' in error) {
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
    }

    const errorMessage = error && typeof error === 'object' && 'message' in error
      ? String(error.message)
      : 'Failed to search Google Drive files';

    throw createError({
      statusCode: 500,
      statusMessage: errorMessage,
    });
  }
});
