import { google } from 'googleapis';

interface DriveFile {
  id?: string | null;
  name?: string | null;
  mimeType?: string | null;
  parents?: string[] | null;
  thumbnailLink?: string | null;
  webContentLink?: string | null;
  webViewLink?: string | null;
}

interface EnhancedFile extends DriveFile {
  imageUrl?: string | null;
  downloadUrl?: string | null;
  viewUrl?: string | null;
}

/**
 * Parse and validate service account credentials from runtime config
 */
function getServiceAccountCredentials(config: any) {
  let serviceAccount: Record<string, string>;

  try {
    serviceAccount = JSON.parse(config.googleServiceAccount || '{}');
  } catch (e) {
    throw new Error('Invalid Google service account configuration');
  }

  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error('Missing Google service account credentials');
  }

  return serviceAccount;
}

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
 * Build Google Drive search query for multiple folders
 */
function buildSearchQuery(nameFilter: string, folderIds: string[]): string {
  let folderQuery = '';

  if (folderIds.length > 0) {
    const folderConditions = folderIds
      .map(folderId => `'${folderId}' in parents`)
      .join(' OR ');
    folderQuery = ` AND (${folderConditions})`;
  }

  return `name contains '${nameFilter}'${folderQuery}`;
}

/**
 * Enhance file objects with additional URL properties
 */
function enhanceFilesWithUrls(files: DriveFile[]): EnhancedFile[] {
  return files.map(file => ({
    ...file,
    imageUrl: file.mimeType?.startsWith('image/')
      ? `https://drive.google.com/uc?id=${file.id}&export=view`
      : file.thumbnailLink,
    downloadUrl: file.webContentLink,
    viewUrl: file.webViewLink
  }));
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const nameFilter = query.name as string;
  const foldersIds = query.foldersIds as string || '';

  // Validate required parameters
  if (!nameFilter) {
    return { error: 'Missing name parameter' };
  }

  try {
    // Setup authentication and Drive client
    const config = useRuntimeConfig();
    const serviceAccount = getServiceAccountCredentials(config);
    const drive = createDriveClient(serviceAccount);

    // Parse folder IDs and build search query
    const folderIds = parseFolderIds(foldersIds, config.googleDriveFolderId);
    const searchQuery = buildSearchQuery(nameFilter, folderIds);

    // Execute search
    const response = await drive.files.list({
      q: searchQuery,
      fields: 'files(id, name, mimeType, parents, thumbnailLink, webContentLink, webViewLink)',
    });

    // Enhance files with additional URLs
    const enhancedFiles = enhanceFilesWithUrls(response.data.files || []);

    return {
      files: enhancedFiles,
      searchedFolders: folderIds,
      query: searchQuery
    };

  } catch (error: any) {
    console.error('Drive API error:', error);
    return { error: error.message || 'Failed to search Google Drive files' };
  }
});
