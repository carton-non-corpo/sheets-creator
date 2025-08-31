/**
 * Test script to verify Google Drive integration
 * Run with: pnpm test:drive
 */

import { useGoogleDrive } from '../server/composables/useGoogleDrive.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testGoogleDriveIntegration() {
  console.log('🧪 Testing Google Drive Integration...\n');

  try {
    const { initialize, searchFiles } = useGoogleDrive();
    
    // Test 1: Initialize the client
    console.log('1️⃣ Testing initialization...');
    await initialize();
    console.log('✅ Initialization successful\n');

    // Test 2: Simple search (this will work even without specific folders)
    console.log('2️⃣ Testing basic search...');
    const result = await searchFiles({
      maxResults: 5,
      includeImages: true,
    });
    
    console.log(`✅ Search successful! Found ${result.totalFiles} files`);
    console.log(`📁 Searched folders: ${result.searchedFolders.join(', ') || 'All accessible'}`);
    console.log(`🔍 Query: ${result.queries.join(', ')}`);
    
    if (result.files.length > 0) {
      console.log('\n📄 Sample files:');
      result.files.slice(0, 3).forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name} (${file.mimeType})`);
        if (file.imageUrl) {
          console.log(`      🖼️  Image URL: ${file.imageUrl}`);
        }
      });
    }

    console.log('\n🎉 All tests passed! Google Drive integration is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.name === 'GoogleDriveAuthError') {
      console.error('\n🔑 Authentication Issue:');
      console.error('   - Check GOOGLE_APPLICATION_CREDENTIALS environment variable');
      console.error('   - Verify service account has Google Drive API access');
      console.error('   - Ensure private key format is correct');
      console.error('   - Current value:', process.env.GOOGLE_APPLICATION_CREDENTIALS ? 
        (process.env.GOOGLE_APPLICATION_CREDENTIALS.startsWith('./') ? 'File path detected' : 'JSON string detected') : 
        'Not set');
    } else if (error.name === 'GoogleDriveRateLimitError') {
      console.error('\n⏱️  Rate Limit Issue:');
      console.error('   - API quota exceeded, try again later');
      console.error('   - Consider implementing exponential backoff');
    } else {
      console.error('\n🐛 Unexpected Error:');
      console.error('   - Check network connectivity');
      console.error('   - Verify Google Drive API is enabled in GCP');
      console.error('   - Full error:', error);
    }
    
    process.exit(1);
  }
}

// Mock Nuxt runtime config for testing
if (typeof useRuntimeConfig === 'undefined') {
  global.useRuntimeConfig = () => ({
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS
  });
}

// Run the test
testGoogleDriveIntegration();
