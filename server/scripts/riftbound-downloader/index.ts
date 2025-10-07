import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface RiftboundCard {
  number: number;
  id: string;
  flags: string[];
  orientation: string;
  title: string;
  altText: string;
}

interface RiftboundMetadata {
  config: {
    assetsBaseUrl: string;
    placeholderCardBaseUrl: string;
    totalCards: number;
    useLightbox: boolean;
    showSearchBar: boolean;
    buildDate: string;
    set: string;
  };
  items: RiftboundCard[];
}

async function downloadImage(url: string, filepath: string): Promise<void> {
  try {
    console.log(`Downloading: ${url}`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    writeFileSync(filepath, new Uint8Array(buffer));
    console.log(`✓ Downloaded: ${filepath}`);
  } catch (error) {
    console.error(`✗ Failed to download ${url}:`, error);
  }
}

async function downloadRiftboundCards(): Promise<void> {
  try {
    const setCode = process.argv[2];
    if (!setCode) {
      console.error('Error: Please provide a set code as a command-line argument.');
      process.exit(1);
    }

    console.log('Fetching metadata from Riftbound API...');
    const metadataUrl = `https://cdn.rgpub.io/public/live/map/riftbound/latest/${setCode}/metadata.json`;
    const response = await fetch(metadataUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
    }

    const metadata: RiftboundMetadata = await response.json();
    console.log(`Found ${metadata.items.length} cards in set ${metadata.config.set}`);

    // Create output directory structure
    const outputDir = join(__dirname, 'output');
    const setDir = join(outputDir, metadata.config.set);

    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    if (!existsSync(setDir)) {
      mkdirSync(setDir, { recursive: true });
    }

    console.log(`Created directory: ${setDir}`);

    // Download each card image
    const downloadPromises = metadata.items.map(async card => {
      const imageUrl = `https://cdn.rgpub.io/public/live/map/riftbound/latest/${setCode}/cards/${card.id}/full-desktop.avif`;
      const filename = `${card.id}_${card.title.replace(/[^a-zA-Z0-9]/g, '_')}.avif`;
      const filepath = join(setDir, filename);

      await downloadImage(imageUrl, filepath);
    });

    // Download all images with a concurrency limit
    const concurrencyLimit = 5;
    for (let i = 0; i < downloadPromises.length; i += concurrencyLimit) {
      const batch = downloadPromises.slice(i, i + concurrencyLimit);
      await Promise.all(batch);
      console.log(`Processed batch ${Math.floor(i / concurrencyLimit) + 1}/${Math.ceil(downloadPromises.length / concurrencyLimit)}`);
    }

    console.log(`\n✓ Download complete! All ${metadata.items.length} cards saved to: ${setDir}`);

  } catch (error) {
    console.error('Error downloading Riftbound cards:', error);
    process.exit(1);
  }
}

// Run the script
console.log('🃏 Riftbound Card Downloader');
console.log('============================');
downloadRiftboundCards();
