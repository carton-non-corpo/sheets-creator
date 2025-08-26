import { google } from 'googleapis';
import { getServiceAccountCredentials } from '../../../service-account';

export default defineEventHandler(async (event) => {
  const fileId = getRouterParam(event, 'id');

  if (!fileId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File ID is required'
    });
  }

  try {
    // Setup authentication and Drive client
    const config = useRuntimeConfig();
    const serviceAccount = getServiceAccountCredentials(config);

    const auth = new google.auth.JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Get file metadata to check if it's an image
    const fileMetadata = await drive.files.get({
      fileId,
      fields: 'mimeType'
    });

    if (!fileMetadata.data.mimeType?.startsWith('image/')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'File is not an image'
      });
    }

    // Get the file content
    const response = await drive.files.get({
      fileId,
      alt: 'media'
    }, { responseType: 'stream' });

    // Set appropriate headers
    setHeader(event, 'Content-Type', fileMetadata.data.mimeType);
    setHeader(event, 'Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    return sendStream(event, response.data);

  } catch (error: any) {
    console.error('Drive image proxy error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch image from Google Drive'
    });
  }
});
