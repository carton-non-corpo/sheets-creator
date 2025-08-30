import { google } from 'googleapis';
import { getServiceAccountCredentials } from '../../service-account';
import type { DriveFile, EnhancedFile } from '~~/common/types/drive';

/**
 * Create authenticated Google Drive client
 */
function createDriveClient(serviceAccount: Record<string, string>) {
  const auth = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  return google.drive({ version: 'v3', auth });
}

/**
 * Parse folder IDs from query parameter (comma-separated string)
 */
function parseFolderIds(foldersParam: string, defaultFolderId?: string): string[] {
  let folderIds: string[] = [];

  if (foldersParam) {
    folderIds = foldersParam.split(',').map(id => id.trim()).filter(Boolean);
  }

  // Fallback to default folder if none provided
  if (folderIds.length === 0 && defaultFolderId) {
    folderIds = [defaultFolderId];
  }

  return folderIds;
}

/**
 * Build Google Drive search query for a single folder
 */
function buildSearchQuery(nameFilter: string, folderId?: string): string {
  let folderQuery = '';

  if (folderId) {
    folderQuery = ` AND '${folderId}' in parents`;
  }

  // Only include image files
  const imageFilter = ` AND (mimeType contains 'image/')`;

  return `name contains '${nameFilter}'${folderQuery}${imageFilter}`;
}

/**
 * Fetch files from a single folder with full pagination (no limits)
 */
async function fetchFilesFromFolder(drive: any, nameFilter: string, folderId?: string) {
  const searchQuery = buildSearchQuery(nameFilter, folderId);
  const allFiles: any[] = [];
  let nextPageToken: string | undefined;

  do {
    const response = await drive.files.list({
      q: searchQuery,
      fields: 'files(id, name, mimeType, parents, thumbnailLink, webContentLink, webViewLink), nextPageToken',
      pageSize: 1000, // Maximum allowed by Google Drive API
      pageToken: nextPageToken,
    });

    const files = response.data.files || [];
    allFiles.push(...files);
    nextPageToken = response.data.nextPageToken;

  } while (nextPageToken);

  return allFiles;
}

/**
 * Enhance file objects with additional URL properties
 */
function enhanceFilesWithUrls(files: any[]): EnhancedFile[] {
  return files.map(file => {
    let imageUrl = null;

    // Use our proxy endpoint for images
    if (file.mimeType?.startsWith('image/') && file.id) {
      imageUrl = `/api/v1/drive-image/${file.id}`;
    }

    return {
      ...file,
      imageUrl,
      downloadUrl: file.webContentLink,
      viewUrl: file.webViewLink
    } as EnhancedFile;
  });
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const nameFilter = query.name as string;
  const foldersIds = query.foldersIds as string || '';

  try {
    // Setup authentication and Drive client
    const config = useRuntimeConfig();
    const serviceAccount = getServiceAccountCredentials(config);
    const drive = createDriveClient(serviceAccount);

    // Parse folder IDs
    const folderIds = parseFolderIds(foldersIds, config.googleDriveFolderId);

    // Fetch files from each folder concurrently using Promise.all
    let fileResults: any[];
    let searchQueries: string[];

    if (folderIds.length === 0) {
      // Search without folder restriction
      const files = await fetchFilesFromFolder(drive, nameFilter);
      fileResults = [files];
      searchQueries = [buildSearchQuery(nameFilter)];
    } else {
      // Search in each folder concurrently
      const fetchPromises = folderIds.map(folderId =>
        fetchFilesFromFolder(drive, nameFilter, folderId)
      );

      fileResults = await Promise.all(fetchPromises);
      searchQueries = folderIds.map(folderId => buildSearchQuery(nameFilter, folderId));
    }

    // Flatten all files from all folders
    const allFiles = fileResults.flat();

    // Remove duplicates (in case a file appears in multiple searches)
    const uniqueFiles = allFiles.filter((file, index, self) =>
      index === self.findIndex(f => f.id === file.id)
    );

    // Enhance files with additional URLs
    const enhancedFiles = enhanceFilesWithUrls(uniqueFiles);

    return {
      files: enhancedFiles,
      searchedFolders: folderIds,
      queries: searchQueries
    };

  } catch (error: any) {
    console.error('Drive API error:', error);
    return { error: error.message || 'Failed to search Google Drive files' };
  }
});
