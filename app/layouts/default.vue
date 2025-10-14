<script setup lang="ts">

</script>

<template>
  <div class="h-screen bg-gray-50 flex flex-row">
    <Nav />
    <div class="flex-1 flex flex-col h-full">
      <Header />
      <main class="flex-1 overflow-y-auto">
        <slot ></slot>
      </main>
    </div>
  </div>
</template>
