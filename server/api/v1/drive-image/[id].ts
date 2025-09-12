import { useGoogleDrive } from '../../../composables/useGoogleDrive';

export default defineEventHandler(async event => {
  const fileId = getRouterParam(event, 'id');

  if (!fileId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File ID is required',
    });
  }

  try {
    const { getFile, getFileStream, isImageFile } = useGoogleDrive();

    // Get file metadata to check if it's an image
    const fileMetadata = await getFile(fileId, 'mimeType');

    if (!isImageFile(fileMetadata)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'File is not an image',
      });
    }

    // Get the file content as stream
    const response = await getFileStream(fileId);

    // Set appropriate headers
    setHeader(event, 'Content-Type', fileMetadata.mimeType || 'image/jpeg');
    setHeader(event, 'Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    setHeader(event, 'X-Content-Type-Options', 'nosniff');

    return sendStream(event, response.data);

  } catch (error: unknown) {
    console.error('❌ Drive image proxy error:', error);

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

    if (error && typeof error === 'object' && 'code' in error && error.code === 'NOT_FOUND') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Image not found in Google Drive',
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch image from Google Drive',
    });
  }
});
