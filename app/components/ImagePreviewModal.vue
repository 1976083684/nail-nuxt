<script setup lang="ts">
const { showImagePreview, closeImagePreview, previewImageUrl } = useModal()
</script>

<template>
  <div
    class="modal-overlay"
    :class="{ active: showImagePreview }"
    style="align-items: center"
    @click="closeImagePreview()"
  >
    <div class="max-w-3xl w-[92%] md:w-[80%]" style="border-radius: 12px; overflow: hidden" @click.stop>
      <img :src="previewImageUrl" alt="" style="width: 100%; display: block; border-radius: 12px">
    </div>
  </div>
</template>
