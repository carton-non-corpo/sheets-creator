<script setup lang="ts">

const cardStore = useCardStore();
const { closeCardDetails } = cardStore;
const { openDetailsCardImageUrl } = storeToRefs(cardStore);

// Prevent flicker by only setting the image URL after the dialog is closed
const displayImageUrl = ref<string>();

watch(openDetailsCardImageUrl, url => {
  if (url) displayImageUrl.value = url;
}, { immediate: true });

function handleOpenChange(open: boolean) {
  if (!open) {
    closeCardDetails();
    setTimeout(() => displayImageUrl.value = undefined, 200);
  }
}
</script>

<template>
  <Dialog :open="!!openDetailsCardImageUrl" @update:open="handleOpenChange">
    <DialogContent class="pt-12">
      <img :src="displayImageUrl" alt="Card image" class="rounded-xl" />
    </DialogContent>
  </Dialog>
</template>
