<script setup lang="ts">
import { Home, Folders, Printer } from 'lucide-vue-next'
</script>

<template>
  <nav class="h-screen w-64 bg-gradient-to-b from-white via-gray-50 to-gray-100 border-r border-gray-200 flex flex-col py-8 px-6">
    <div class="mb-6 flex items-center gap-3">
      <span class="font-extrabold text-xl tracking-tight text-gray-900">Carton Club</span>
    </div>
    <ul class="flex-1 space-y-2">
      <li>
        <NuxtLink to="/" class="flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors group">
          <Printer class="w-5 h-5 text-gray-400 group-hover:text-primary" />
          <span>Planches</span>
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/decks" class="flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors group">
          <Folders class="w-5 h-5 text-gray-400 group-hover:text-primary" />
          <span>Decks</span>
        </NuxtLink>
      </li>
    </ul>
    <div class="mt-auto pt-8 border-t border-gray-200">
      <NuxtLink to="https://discord.gg/A8uTs4ZXse" class="flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors group">
        <Home class="w-5 h-5 text-gray-400 group-hover:text-primary" />
        <span>Discord</span>
      </NuxtLink>
    </div>
  </nav>
</template>
