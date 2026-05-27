<script setup lang="ts">
const { toasts } = useToast()
</script>

<template>
  <div class="toast-container">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="toast"
      :class="[toast.type, { show: toast.visible }]"
    >
      <i
        :class="`fa-solid ${
          toast.type === 'success' ? 'fa-check-circle' :
          toast.type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'
        } mr-2`"
      />
      {{ toast.message }}
    </div>
  </div>
</template>
