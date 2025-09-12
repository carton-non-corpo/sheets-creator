export interface DriveFile {
  id: string;
  name: string;
  mimeType?: string | null;
  parents?: string[] | null;
  thumbnailLink?: string | null;
  webContentLink?: string | null;
  webViewLink?: string | null;
}

export interface EnhancedFile extends DriveFile {
  imageUrl?: string | null;
  downloadUrl?: string | null;
  viewUrl?: string | null;
}
