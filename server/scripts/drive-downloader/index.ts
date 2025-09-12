#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import type { drive_v3 } from 'googleapis';
import { google } from 'googleapis';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface DriveFileMetadata extends drive_v3.Schema$File {
    imageUrl?: string;
    downloadUrl?: string;
    viewUrl?: string;
    thumbnailUrl?: string;
}

interface DownloadResult {
    file: DriveFileMetadata;
    success: boolean;
    error?: string;
    outputPath?: string;
}

interface FolderInfo {
    id: string;
    name: string;
    path: string;
}

class GoogleDriveDownloader {
  private drive!: drive_v3.Drive;
  private baseOutputDir: string;
  private failedDownloads: DownloadResult[] = [];
  private successfulDownloads: DownloadResult[] = [];

  constructor() {
    this.baseOutputDir = path.join(__dirname, 'output');
    this.setupAuth();
  }

  private setupAuth() {
    let serviceAccount;
    // Always use GOOGLE_APPLICATION_CREDENTIALS as a file path
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './application_default_credentials.json';
    if (!fs.existsSync(credPath)) {
      // Try to decode B64_GOOGLE_APPLICATION_CREDENTIALS and write to file
      const b64Creds = process.env.B64_GOOGLE_APPLICATION_CREDENTIALS;
      if (b64Creds) {
        let creds = b64Creds;
        // Remove wrapping quotes if present
        if (creds.startsWith('\'')) creds = creds.slice(1);
        if (creds.endsWith('\'')) creds = creds.slice(0, -1);
        fs.writeFileSync(credPath, creds);
      } else {
        throw new Error('Google service account credentials not found. Set GOOGLE_APPLICATION_CREDENTIALS to a valid file or provide B64_GOOGLE_APPLICATION_CREDENTIALS.');
      }
    }
    try {
      serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    } catch {
      throw new Error('Invalid Google service account configuration. Make sure GOOGLE_APPLICATION_CREDENTIALS points to a valid JSON file.');
    }
    if (!serviceAccount.client_email || !serviceAccount.private_key) {
      throw new Error('Missing Google service account credentials. Check client_email and private_key.');
    }
    const auth = new google.auth.JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key.replace(/\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    this.drive = google.drive({
      version: 'v3',
      auth,
      timeout: 30000,
      retry: true,
      retryConfig: {
        retry: 3,
        retryDelay: 1000,
        statusCodesToRetry: [[100, 199], [429, 429], [500, 599]],
      },
    });
  }

  private async askQuestion(question: string): Promise<string> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise(resolve => {
      rl.question(question, answer => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }

  private async createDirectory(dirPath: string): Promise<void> {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
    } catch (error) {
      console.error(`Failed to create directory ${dirPath}:`, error);
      throw error;
    }
  }

  private isImageFile(file: DriveFileMetadata): boolean {
    if (!file.name) return false;

    const fileName = file.name.toLowerCase();

    // Explicitly exclude PSD files first
    if (fileName.endsWith('.psd')) {
      return false;
    }

    // Exclude other non-image files
    const excludedExtensions = ['.zip', '.rar', '.txt', '.doc', '.docx', '.pdf', '.psd', '.ai', '.eps'];
    if (excludedExtensions.some(ext => fileName.endsWith(ext))) {
      return false;
    }

    // Check MIME type for images (but not for PSD which might have image MIME type)
    if (file.mimeType && file.mimeType.startsWith('image/') && !fileName.endsWith('.psd')) {
      return true;
    }

    // Check file extension for common image formats
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.tif'];

    return imageExtensions.some(ext => fileName.endsWith(ext));
  }

  private async getFolderInfo(folderId: string): Promise<FolderInfo | null> {
    try {
      const response = await this.drive.files.get({
        fileId: folderId,
        fields: 'id, name, parents',
      });

      return {
        id: response.data.id || folderId,
        name: response.data.name || 'Unknown Folder',
        path: '',
      };
    } catch (error) {
      console.error(`Failed to get folder info for ${folderId}:`, error);
      return null;
    }
  }

  private async getAllFiles(folderId: string, folderPath: string = ''): Promise<Array<{ file: DriveFileMetadata; folderPath: string }>> {
    console.log(`📁 Scanning folder: ${folderPath || 'Root folder'}`);

    const allFiles: Array<{ file: DriveFileMetadata; folderPath: string }> = [];
    let pageToken: string | undefined;

    try {
      do {
        const response = await this.drive.files.list({
          q: `'${folderId}' in parents and trashed = false`,
          fields: 'nextPageToken, files(id, name, mimeType, size, parents)',
          pageSize: 100,
          pageToken,
        });

        const files = response.data.files || [];

        for (const file of files) {
          if (file.mimeType === 'application/vnd.google-apps.folder') {
            // Recursively get files from subfolder
            const subfolderPath = path.join(folderPath, file.name || 'Unknown');
            const subfolderFiles = await this.getAllFiles(file.id!, subfolderPath);
            allFiles.push(...subfolderFiles);
          } else if (this.isImageFile(file)) {
            // Only add image files
            allFiles.push({ file, folderPath });
          } else {
            // Debug: Log skipped files
            console.log(`⏭️  Skipping non-image file: ${file.name} (${file.mimeType || 'no MIME type'})`);
          }
        }

        pageToken = response.data.nextPageToken || undefined;
      } while (pageToken);

      return allFiles;
    } catch (error) {
      console.error(`Failed to list files in folder ${folderId}:`, error);
      return [];
    }
  }

  private async downloadFile(file: DriveFileMetadata, outputDir: string): Promise<DownloadResult> {
    const sanitizedName = (file.name || 'unknown').replace(/[<>:"/\\|?*]/g, '_');
    const outputPath = path.join(outputDir, sanitizedName);

    try {
      // Skip Google Apps files (docs, sheets, etc.) as they can't be directly downloaded
      if (file.mimeType && file.mimeType.startsWith('application/vnd.google-apps.')) {
        return {
          file,
          success: false,
          error: `Skipped Google Apps file (${file.mimeType})`,
          outputPath,
        };
      }

      // Check if file already exists
      if (fs.existsSync(outputPath)) {
        console.log(`⏭️  Skipping existing file: ${sanitizedName}`);
        return {
          file,
          success: true,
          outputPath,
        };
      }

      console.log(`⬇️  Downloading: ${sanitizedName} (${this.formatFileSize(file.size || '0')})`);

      const response = await this.drive.files.get({
        fileId: file.id!,
        alt: 'media',
      }, { responseType: 'stream' });

      await pipeline(response.data, createWriteStream(outputPath));

      return {
        file,
        success: true,
        outputPath,
      };
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Unknown error';
      console.error(`❌ Failed to download ${sanitizedName}:`, errorMessage);
      return {
        file,
        success: false,
        error: errorMessage,
        outputPath,
      };
    }
  }

  private formatFileSize(bytes: string | number | null | undefined): string {
    if (!bytes) return 'Unknown size';

    const size = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    if (isNaN(size)) return 'Unknown size';
    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let fileSize = size;

    while (fileSize >= 1024 && unitIndex < units.length - 1) {
      fileSize /= 1024;
      unitIndex++;
    }

    return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
  }

  private async downloadFilesInBatches(allFileItems: Array<{ file: DriveFileMetadata; folderPath: string }>, folderOutputDir: string): Promise<void> {
    const batchSize = 25;
    let totalProcessed = 0;

    for (let i = 0; i < allFileItems.length; i += batchSize) {
      const batch = allFileItems.slice(i, i + batchSize);
      const batchPromises = batch.map(async ({ file, folderPath }, batchIndex) => {
        const globalIndex = i + batchIndex + 1;
        const progress = `[${globalIndex}/${allFileItems.length}]`;

        console.log(`${progress} Processing: ${path.join(folderPath, file.name || 'unknown')}`);

        // Create subdirectory if needed
        const fileOutputDir = folderPath
          ? path.join(folderOutputDir, folderPath)
          : folderOutputDir;

        await this.createDirectory(fileOutputDir);

        // Download file
        return await this.downloadFile(file, fileOutputDir);
      });

      // Wait for all files in this batch to complete
      const batchResults = await Promise.all(batchPromises);

      // Process results
      for (const result of batchResults) {
        if (result.success) {
          this.successfulDownloads.push(result);
        } else {
          this.failedDownloads.push(result);
        }
      }

      totalProcessed += batch.length;

      // Show batch progress
      if (i + batchSize < allFileItems.length) {
        console.log(`\n✅ Completed batch ${Math.ceil((i + batchSize) / batchSize)} (${totalProcessed}/${allFileItems.length} files)\n`);

        // Small delay between batches to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  private async retryFailedDownloads(): Promise<void> {
    if (this.failedDownloads.length === 0) {
      console.log('✅ No failed downloads to retry!');
      return;
    }

    console.log(`\n🔄 Found ${this.failedDownloads.length} failed downloads.`);
    const retry = await this.askQuestion('Would you like to retry failed downloads? (y/n): ');

    if (retry.toLowerCase() === 'y' || retry.toLowerCase() === 'yes') {
      console.log('\n🔄 Retrying failed downloads...');
      const failedToRetry = [...this.failedDownloads];
      this.failedDownloads = [];

      for (const failed of failedToRetry) {
        if (failed.outputPath) {
          const outputDir = path.dirname(failed.outputPath);
          const result = await this.downloadFile(failed.file, outputDir);

          if (result.success) {
            this.successfulDownloads.push(result);
          } else {
            this.failedDownloads.push(result);
          }
        }
      }

      // Ask to retry again if there are still failures
      if (this.failedDownloads.length > 0) {
        await this.retryFailedDownloads();
      }
    }
  }

  public async run(): Promise<void> {
    try {
      console.log('🚀 Google Drive Image Downloader\n');

      // Ask for folder ID
      const folderId = await this.askQuestion('Enter Google Drive folder ID: ');

      if (!folderId) {
        console.log('❌ No folder ID provided. Exiting.');
        return;
      }

      // Get folder info
      console.log('\n📋 Getting folder information...');
      const folderInfo = await this.getFolderInfo(folderId);

      if (!folderInfo) {
        console.log('❌ Could not access folder. Check the folder ID and permissions.');
        return;
      }

      console.log(`📁 Folder: ${folderInfo.name}`);
      console.log(`🆔 ID: ${folderInfo.id}`);

      // Create output directory
      const folderOutputDir = path.join(this.baseOutputDir, folderId);
      await this.createDirectory(folderOutputDir);
      console.log(`📂 Output directory: ${folderOutputDir}`);

      // Get all files recursively
      console.log('\n🔍 Scanning for files...');
      const allFileItems = await this.getAllFiles(folderId);

      if (allFileItems.length === 0) {
        console.log('📭 No files found in the folder.');
        return;
      }

      console.log(`📄 Found ${allFileItems.length} image files to download\n`);

      // Download all files in batches of 5
      await this.downloadFilesInBatches(allFileItems, folderOutputDir);

      // Show summary
      console.log('\n📊 Download Summary:');
      console.log(`✅ Successful: ${this.successfulDownloads.length}`);
      console.log(`❌ Failed: ${this.failedDownloads.length}`);

      if (this.failedDownloads.length > 0) {
        console.log('\n❌ Failed downloads:');
        this.failedDownloads.forEach(failed => {
          console.log(`   - ${failed.file.name}: ${failed.error}`);
        });
      }

      // Offer to retry failed downloads
      await this.retryFailedDownloads();

      console.log('\n🎉 Download process completed!');
      console.log(`📂 Files saved to: ${folderOutputDir}`);

    } catch (error) {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    }
  }
}

// Run the downloader
const downloader = new GoogleDriveDownloader();
downloader.run().catch(console.error);
