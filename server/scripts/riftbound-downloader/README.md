# Riftbound Card Downloader

A TypeScript script that automatically downloads all card images from the Riftbound card game API for any available set.

## 🚀 Features

- **Multi-set support**: Download cards from any available Riftbound set (OGN, OGS, etc.)
- **Batch processing**: Downloads images in batches with concurrency limiting to avoid overwhelming the server
- **Smart organization**: Automatically creates organized folder structure by set
- **Progress tracking**: Real-time progress feedback with batch completion indicators
- **Error handling**: Continues downloading other files if individual downloads fail
- **Clean naming**: Generates clean filenames using card ID and sanitized title

## 📋 Prerequisites

- Node.js (version 18+)
- TypeScript execution environment (`tsx` or similar)

## 🛠️ Installation

No installation required - the script uses Node.js built-in modules and the global `fetch` API.

## 🎯 Usage

### Basic Usage

Run the script with a set code as a command-line argument:

```bash
npx tsx index.ts <SET_CODE>
```

### Examples

Download cards from the OGN set:
```bash
npx tsx index.ts OGN
```

Download cards from the OGS set:
```bash
npx tsx index.ts OGS
```

### Command Line Arguments

- `<SET_CODE>` (required): The set code to download (e.g., OGN, OGS)

## 📁 Output Structure

The script creates the following directory structure:

```
output/
└── <SET_CODE>/
    ├── <CARD-ID>_<CLEAN_TITLE>.avif
    ├── <CARD-ID>_<CLEAN_TITLE>.avif
    └── ...
```

### Example Output

```
output/
└── OGN/
    ├── OGN-001_Blazing_Scorcher.avif
    ├── OGN-002_Brazen_Buccaneer.avif
    ├── OGN-003_Chemtech_Enforcer.avif
    └── ...
```

## 🔧 How It Works

1. **Fetches Metadata**: Retrieves card information from the Riftbound API
   - URL: `https://cdn.rgpub.io/public/live/map/riftbound/latest/<SET_CODE>/metadata.json`

2. **Creates Directory Structure**: Automatically creates output directories organized by set

3. **Downloads Images**: Downloads high-quality card images in AVIF format
   - URL Pattern: `https://cdn.rgpub.io/public/live/map/riftbound/latest/<SET_CODE>/cards/<CARD-ID>/full-desktop.avif`

4. **Batch Processing**: Downloads images in batches of 5 to avoid rate limiting

5. **Progress Tracking**: Shows real-time progress and completion status

## 📊 Sample Output

```
🃏 Riftbound Card Downloader
============================
Fetching metadata from Riftbound API...
Found 353 cards in set OGN
Created directory: /path/to/output/OGN
Downloading: https://cdn.rgpub.io/public/live/map/riftbound/latest/OGN/cards/OGN-001/full-desktop.avif
✓ Downloaded: /path/to/output/OGN/OGN-001_Blazing_Scorcher.avif
...
Processed batch 1/71
Processed batch 2/71
...
✓ Download complete! All 353 cards saved to: /path/to/output/OGN
```

## 🔍 API Response Structure

The script expects the following metadata structure from the Riftbound API:

```typescript
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

interface RiftboundCard {
  number: number;
  id: string;
  flags: string[];
  orientation: string;
  title: string;
  altText: string;
}
```

## ⚠️ Error Handling

- **Missing Set Code**: Script exits with error message if no set code is provided
- **Invalid Set Code**: Script exits with error if the set code doesn't exist on the API
- **Network Errors**: Individual download failures are logged but don't stop the entire process
- **File System Errors**: Directory creation and file writing errors are handled gracefully

## 🎨 File Naming Convention

Card images are saved with the following naming pattern:
- Format: `<CARD-ID>_<SANITIZED-TITLE>.avif`
- Special characters in titles are replaced with underscores
- Examples:
  - `OGN-001_Blazing_Scorcher.avif`
  - `OGN-008_Get_Excited_.avif`

## 🚦 Rate Limiting

The script implements built-in rate limiting:
- **Batch Size**: 5 concurrent downloads per batch
- **Batch Processing**: Waits for each batch to complete before starting the next
- **Progress Feedback**: Shows batch completion progress

## 🔧 Technical Details

- **Language**: TypeScript with ES Modules
- **Image Format**: AVIF (high-quality, modern format)
- **Image Resolution**: Desktop quality (`full-desktop`)
- **Concurrency**: Limited to 5 simultaneous downloads
- **Dependencies**: Node.js built-ins only (fs, path, url)

## 📝 Available Sets

The script works with any set available on the Riftbound API. Common sets include:
- `OGN` - Original Genesis
- `OGS` - (Set name varies by availability)

To discover available sets, check the Riftbound API documentation or try different set codes.

## 🤝 Contributing

This script is part of the imprimerie-sheets-creator project. Feel free to submit improvements or bug fixes!

## 📄 License

This project follows the same license as the parent imprimerie-sheets-creator project.