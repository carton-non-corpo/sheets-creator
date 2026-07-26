#!/usr/bin/env node

/**
 * Google Drive uploader
 * ---------------------
 * Pushes local image files into a Google Drive folder (e.g. a new card set).
 *
 * Auth: prefers your gcloud user credentials (ADC) when available, because
 * service accounts no longer have Drive storage quota and cannot own uploaded
 * files in a My Drive folder. One-time setup:
 *   gcloud auth application-default login \
 *     --scopes=https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/cloud-platform
 *   gcloud auth application-default set-quota-project carton-club-app
 * Your account must have Editor access to the target folder.
 *
 * Falls back to the downloader's service-account credentials (set
 * DRIVE_UPLOADER_AUTH=service-account to force this). That path only works for
 * Shared Drive targets, and the folder must be shared with:
 *   drive-files@carton-club-app.iam.gserviceaccount.com
 *
 * Usage:
 *   node --import tsx/esm server/scripts/drive-uploader/index.ts \
 *     --src ./path/to/images --folder <driveFolderId> [--overwrite] [--dry-run]
 *
 * Or via env vars: SRC_DIR, DRIVE_FOLDER_ID
 * Or via the Makefile: `make push-images SRC=./images FOLDER_ID=<id>`
 *
 * By default, files whose name already exists in the target folder are skipped
 * (idempotent). Pass --overwrite to replace them instead.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import type { drive_v3 } from 'googleapis';
import { google } from 'googleapis';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif'];

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.webp': 'image/webp',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',
};

interface CliArgs {
  src: string;
  folder: string;
  overwrite: boolean;
  dryRun: boolean;
}

function parseArgs(): CliArgs {
  const argv = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i !== -1 && argv[i + 1] ? argv[i + 1] : undefined;
  };

  const src = get('--src') || process.env.SRC_DIR || '';
  const folder = get('--folder') || process.env.DRIVE_FOLDER_ID || '';
  const overwrite = argv.includes('--overwrite');
  const dryRun = argv.includes('--dry-run');

  if (!src) throw new Error('Missing source directory. Pass --src <dir> or set SRC_DIR.');
  if (!folder) throw new Error('Missing target folder id. Pass --folder <id> or set DRIVE_FOLDER_ID.');

  return { src, folder, overwrite, dryRun };
}

const GCLOUD_ADC_PATH = path.join(
  process.env.HOME || process.env.USERPROFILE || '',
  '.config', 'gcloud', 'application_default_credentials.json',
);

/**
 * User credentials (from `gcloud auth application-default login`) are preferred:
 * files end up owned by the human account, which has storage quota — service
 * accounts don't, so SA uploads into My Drive folders are rejected by Google.
 */
function getUserAuth(): InstanceType<typeof google.auth.GoogleAuth> | null {
  if (process.env.DRIVE_UPLOADER_AUTH === 'service-account') return null;
  if (!fs.existsSync(GCLOUD_ADC_PATH)) return null;
  try {
    const creds = JSON.parse(fs.readFileSync(GCLOUD_ADC_PATH, 'utf8'));
    if (creds.type !== 'authorized_user') return null;
  } catch {
    return null;
  }
  return new google.auth.GoogleAuth({
    keyFile: GCLOUD_ADC_PATH,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
}

function setupAuth(): drive_v3.Drive {
  const userAuth = getUserAuth();
  if (userAuth) {
    console.log('🔑 auth: gcloud user credentials (uploaded files owned by your account)');
    return buildDrive(userAuth);
  }

  let serviceAccount;
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    || path.resolve(process.cwd(), 'application_default_credentials.json');

  if (!fs.existsSync(credPath)) {
    const b64Creds = process.env.B64_GOOGLE_APPLICATION_CREDENTIALS;
    if (b64Creds) {
      let creds = b64Creds;
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

  console.log('🔑 auth: service account (only works for Shared Drive targets)');
  return buildDrive(new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key.replace(/\\n/g, '\n'),
    // Write scope — the SA must have Editor access on the target folder.
    scopes: ['https://www.googleapis.com/auth/drive'],
  }));
}

function buildDrive(auth: drive_v3.Options['auth']): drive_v3.Drive {
  return google.drive({
    version: 'v3',
    auth,
    timeout: 60000,
    retry: true,
    retryConfig: {
      retry: 3,
      retryDelay: 1000,
      statusCodesToRetry: [[100, 199], [429, 429], [500, 599]],
    },
  });
}

function listLocalImages(srcDir: string): string[] {
  const abs = path.resolve(process.cwd(), srcDir);
  if (!fs.existsSync(abs)) throw new Error(`Source directory does not exist: ${abs}`);
  return fs.readdirSync(abs)
    .filter(name => IMAGE_EXTENSIONS.includes(path.extname(name).toLowerCase()))
    .filter(name => fs.statSync(path.join(abs, name)).isFile())
    .sort()
    .map(name => path.join(abs, name));
}

async function listExistingNames(drive: drive_v3.Drive, folderId: string): Promise<Map<string, string>> {
  const byName = new Map<string, string>(); // name -> fileId
  let pageToken: string | undefined;
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name)',
      pageSize: 1000,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    for (const f of res.data.files || []) {
      if (f.name && f.id) byName.set(f.name, f.id);
    }
    pageToken = res.data.nextPageToken || undefined;
  } while (pageToken);
  return byName;
}

async function main() {
  const { src, folder, overwrite, dryRun } = parseArgs();
  const drive = setupAuth();

  const files = listLocalImages(src);
  if (files.length === 0) {
    console.log(`⚠️  No image files found in ${src}`);
    return;
  }

  console.log(`📤 Uploading ${files.length} image(s) → Drive folder ${folder}`);
  console.log(`   overwrite=${overwrite} dryRun=${dryRun}\n`);

  const existing = await listExistingNames(drive, folder);

  let uploaded = 0;
  let skipped = 0;
  let replaced = 0;
  const failures: { name: string; error: string }[] = [];

  for (const filePath of files) {
    const name = path.basename(filePath);
    const ext = path.extname(name).toLowerCase();
    const mimeType = MIME_BY_EXT[ext] || 'application/octet-stream';
    const existingId = existing.get(name);

    try {
      if (existingId && !overwrite) {
        console.log(`⏭️  skip (exists): ${name}`);
        skipped++;
        continue;
      }

      if (dryRun) {
        console.log(`🧪 would ${existingId ? 'replace' : 'upload'}: ${name}`);
        continue;
      }

      if (existingId && overwrite) {
        await drive.files.update({
          fileId: existingId,
          media: { mimeType, body: fs.createReadStream(filePath) },
          supportsAllDrives: true,
        });
        console.log(`♻️  replaced: ${name}`);
        replaced++;
      } else {
        await drive.files.create({
          requestBody: { name, parents: [folder] },
          media: { mimeType, body: fs.createReadStream(filePath) },
          fields: 'id, name',
          supportsAllDrives: true,
        });
        console.log(`✅ uploaded: ${name}`);
        uploaded++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ failed: ${name} — ${msg}`);
      failures.push({ name, error: msg });
    }
  }

  console.log('\n──────── summary ────────');
  console.log(`uploaded: ${uploaded}  replaced: ${replaced}  skipped: ${skipped}  failed: ${failures.length}`);
  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  - ${f.name}: ${f.error}`);
    process.exitCode = 1;
  }
}

main().catch(err => {
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
