<script setup lang="ts">
const { initTheme } = useTheme()

onMounted(() => {
  initTheme()
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
