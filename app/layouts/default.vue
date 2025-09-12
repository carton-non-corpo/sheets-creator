<script setup lang="ts">

</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-row">
    <Nav />
    <div class="flex-1 flex flex-col min-h-screen">
      <Header />
      <main class="flex-1 overflow-y-auto" style="max-height: calc(100vh - 80px);">
        <slot ></slot>
      </main>
    </div>
  </div>
</template>
