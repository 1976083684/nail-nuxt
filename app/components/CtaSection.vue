<script setup lang="ts">
const { openBooking } = useModal()
const { get } = useSiteContent()
</script>

<template>
  <section class="py-16 md:py-24 px-4 md:px-6 relative overflow-hidden">
    <div class="absolute inset-0" style="background: radial-gradient(ellipse at center, var(--glow1), transparent 70%)" />
    <div class="relative z-10 text-center max-w-2xl mx-auto reveal">
      <h2 class="font-display text-3xl md:text-5xl font-bold mb-4 md:mb-6">{{ get('cta', 'cta_title', '准备好变美了吗') }}</h2>
      <p class="mb-8 md:mb-10 text-sm md:text-lg" style="color: var(--text-muted)">
        {{ get('cta', 'cta_desc', '只需几分钟，即可预约专属你的美甲时光') }}
      </p>
      <button class="btn-primary text-sm md:text-base px-10 py-3.5 md:px-12 md:py-4" @click="openBooking()">
        <i class="fa-solid fa-sparkles mr-2" />开始预约
      </button>
    </div>
  </section>
</template>
