# Google Drive Image Downloader

This script downloads only image files from a Google Drive folder and its subfolders recursively, processing 5 files at a time for optimal performance.

## Prerequisites

1. **Google Service Account**: You need a Google Service Account with access to the Google Drive API.
2. **Environment Variable**: Set the `GOOGLE_SERVICE_ACCOUNT` environment variable with your service account JSON credentials.

## Setup

1. Make sure you have the environment variable set in your `.env` file:
   ```env
   GOOGLE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key_id":"..."}
   ```

2. The service account must have access to the Google Drive folder you want to download.

## Usage

### Option 1: Using npm script (recommended)
```bash
pnpm run download:drive
```

### Option 2: Direct execution
```bash
npx tsx server/scripts/driver-downloader/index.ts
```

## How it works

1. **Authentication**: Uses the same Google Service Account authentication as the main application
2. **Input**: Prompts you to enter a Google Drive folder ID
3. **Scanning**: Recursively scans the folder and all subfolders to find image files only
4. **Filtering**: Only downloads image files (PNG, JPG, JPEG, GIF, BMP, WEBP, SVG, TIFF) - skips PSD, TXT, ZIP, etc.
5. **Batch Processing**: Downloads 5 images simultaneously for optimal performance
6. **Download**: Downloads all image files to `./server/scripts/driver-downloader/output/[folderId]/`
7. **Folder Structure**: Preserves the original folder structure in the output directory
8. **Error Handling**: Tracks failed downloads and offers to retry them
9. **Retry Logic**: At the end of execution, asks if you want to retry failed downloads

## Features

- ✅ **Image-only filtering** - Downloads only image files, skips PSD, TXT, ZIP, etc.
- ✅ **Batch processing** - Downloads 5 files simultaneously for optimal performance
- ✅ **Recursive folder scanning** - Scans all subfolders automatically
- ✅ **Preserves folder structure** - Maintains original directory hierarchy
- ✅ **Progress tracking** - Shows download progress with file size information
- ✅ **Skip existing files** - Won't re-download already existing files
- ✅ **Smart file detection** - Uses both MIME types and file extensions
- ✅ **Retry mechanism** - Offers to retry failed downloads at the end
- ✅ **Interactive prompts** - User-friendly command-line interface
- ✅ **Detailed summary** - Shows comprehensive download statistics

## Output Structure

```
server/scripts/driver-downloader/output/
└── [folderId]/
    ├── image1.jpg
    ├── image2.png
    └── subfolder/
        ├── image3.png
        └── image4.gif
```

## File Types

- **Supported**: Image files only (PNG, JPG, JPEG, GIF, BMP, WEBP, SVG, TIFF, TIF)
- **Skipped**: All non-image files (PSD, TXT, ZIP, PDF, DOC, etc.) and Google Apps files

## Performance

- **Batch Processing**: Downloads 5 images simultaneously for optimal speed
- **API Respectful**: Small delays between batches to respect Google Drive API limits
- **Memory Efficient**: Streams files directly to disk without loading into memory

## Error Handling

The script handles various error scenarios:
- Invalid folder IDs
- Network timeouts
- Permission errors
- File access issues
- Large file downloads

Failed downloads are tracked and can be retried at the end of execution.

## Getting a Google Drive Folder ID

1. Open Google Drive in your browser
2. Navigate to the folder you want to download
3. Look at the URL: `https://drive.google.com/drive/folders/[FOLDER_ID]`
4. Copy the `FOLDER_ID` part

Example: If the URL is `https://drive.google.com/drive/folders/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`, the folder ID is `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`.
