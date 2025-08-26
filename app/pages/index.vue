<script setup lang="ts">
definePageMeta({ name: 'Planches', title: 'Planches' })

interface DriveFile {
  id?: string | null;
  name?: string | null;
  mimeType?: string | null;
  imageUrl?: string | null;
  downloadUrl?: string | null;
  viewUrl?: string | null;
  thumbnailLink?: string | null;
}

const foldersIds = ref<string[]>(['1EAqEy5Hpb-DTOj1nUdwxHpnrBx7MexXH']);
const files = ref<DriveFile[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('000');
const imageLoaded = ref<Record<string, boolean>>({});
const imageErrors = ref<Record<string, boolean>>({});

function handleImageError(event: Event) {
  const target = event.target as HTMLImageElement;
  const fileId = target.closest('[data-file-id]')?.getAttribute('data-file-id');
  if (fileId) {
    const currentSrc = target.src;
    
    // Try different Google Drive URL formats
    if (currentSrc.includes('lh3.googleusercontent.com')) {
      // Try the drive.google.com format
      target.src = `https://drive.google.com/uc?id=${fileId}&export=view`;
      return;
    } else if (currentSrc.includes('drive.google.com/uc')) {
      // Try the thumbnail link if available
      const file = files.value.find(f => f.id === fileId);
      if (file?.thumbnailLink) {
        target.src = file.thumbnailLink;
        return;
      }
    }
    
    // If all formats fail, hide the image
    imageErrors.value[fileId] = true;
    console.log('All image formats failed for file:', fileId);
    target.style.display = 'none';
  }
};

async function handleImageLoad(event: Event) {
  const target = event.target as HTMLImageElement;
  const fileId = target.closest('[data-file-id]')?.getAttribute('data-file-id');
  if (fileId) {
    imageLoaded.value[fileId] = true;
    console.log('Image loaded successfully for file:', fileId);
  }
};

async function fetchFiles() {
  loading.value = true;
  error.value = null;
  
  try {
    const res = await fetch(`/api/v1/drive-files?name=${searchQuery.value}&foldersIds=${foldersIds.value.join(',')}`);
    const data = await res.json();
    
    if (data.error) {
      error.value = data.error;
    } else {
      files.value = data.files || [];
    }
  } catch (err) {
    error.value = 'Failed to fetch files';
    console.error('Error fetching files:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchFiles();
});
</script>

<template>
  <NuxtLayout>
    <div class="p-8">
      <h1 class="text-2xl font-bold mb-6">Planches</h1>
      
      <!-- Search Section -->
      <div class="mb-6 flex gap-4 items-end">
        <div class="flex-1">
          <label for="search" class="block text-sm font-medium text-gray-700 mb-2">
            Search Files
          </label>
          <input
            id="search"
            v-model="searchQuery"
            type="text"
            placeholder="Enter search term..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            @keyup.enter="fetchFiles"
          />
        </div>
        <button
          @click="fetchFiles"
          :disabled="loading"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Searching...' : 'Search' }}
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
        <p class="text-red-800">{{ error }}</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-2 text-gray-600">Loading files...</span>
      </div>

      <!-- Files Grid -->
      <div v-else-if="files.length > 0" class="space-y-6">
        <div class="text-sm text-gray-600 mb-4">
          Found {{ files.length }} file{{ files.length !== 1 ? 's' : '' }}
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div
            v-for="file in files"
            :key="file.id"
            :data-file-id="file.id"
            class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <!-- Debug Info (remove in production) -->
            <div class="text-xs p-2 bg-gray-50 border-b">
              <div>ID: {{ file.id }}</div>
              <div>Image URL: {{ file.imageUrl ? 'Available' : 'None' }}</div>
              <div v-if="file.imageUrl" class="truncate">{{ file.imageUrl }}</div>
            </div>
            
            <!-- Image -->
            <div class="aspect-square bg-gray-100 relative">
              <img
                v-if="file.imageUrl"
                :src="file.imageUrl"
                :alt="file.name || 'File'"
                class="w-full h-full object-cover"
                @error="handleImageError"
                @load="handleImageLoad"
                crossorigin="anonymous"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-gray-400"
              >
                <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                </svg>
              </div>
              
              <!-- Loading indicator for images -->
              <div 
                v-if="file.imageUrl && !imageLoaded[file.id || '']"
                class="absolute inset-0 flex items-center justify-center bg-gray-100"
              >
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            </div>
            
            <!-- File Info -->
            <div class="p-4">
              <h3 class="font-medium text-gray-900 truncate mb-2">
                {{ file.name || 'Unnamed File' }}
              </h3>
              
              <div class="text-xs text-gray-500 mb-3">
                {{ file.mimeType }}
              </div>
              
              <!-- Action Buttons -->
              <div class="flex gap-2">
                <a
                  v-if="file.viewUrl"
                  :href="file.viewUrl"
                  target="_blank"
                  class="flex-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
                >
                  View
                </a>
                <a
                  v-if="file.downloadUrl"
                  :href="file.downloadUrl"
                  target="_blank"
                  class="flex-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 text-center"
                >
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div v-else-if="!loading" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No files found</h3>
        <p class="mt-1 text-sm text-gray-500">Try searching with a different term.</p>
      </div>
    </div>
  </NuxtLayout>
</template>
