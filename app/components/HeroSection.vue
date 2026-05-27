<script setup lang="ts">
const { openBooking } = useModal()
const { get } = useSiteContent()

const particles = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  size: Math.random() * 4 + 2,
  left: Math.random() * 100,
  top: Math.random() * 100,
  duration: Math.random() * 15 + 10,
  delay: Math.random() * -20,
}))
</script>

<template>
  <header id="hero" class="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
    <!-- Glow Blobs -->
    <div class="hero-glow g1" style="width: 400px; height: 400px; background: var(--glow1); top: -10%; left: -10%" />
    <div class="hero-glow g2" style="width: 350px; height: 350px; background: var(--glow2); bottom: 10%; right: -10%" />
    <div class="hero-glow g3" style="width: 250px; height: 250px; background: var(--glow3); top: 40%; left: 50%" />

    <!-- Particles -->
    <div class="absolute inset-0 pointer-events-none">
      <div
        v-for="p in particles"
        :key="p.id"
        class="particle"
        :style="{
          width: p.size + 'px',
          height: p.size + 'px',
          left: p.left + '%',
          top: p.top + '%',
          animationDuration: p.duration + 's',
          animationDelay: p.delay + 's',
        }"
      />
    </div>

    <!-- Content -->
    <div class="relative z-10 text-center max-w-3xl">
      <p
        class="text-xs md:text-sm tracking-[.2em] md:tracking-[.3em] mb-4 md:mb-6 uppercase"
        style="color: var(--accent)"
      >
        {{ get('hero', 'hero_subtitle', 'Premium Nail Art Studio') }}
      </p>
      <h1 class="font-display text-4xl md:text-7xl font-900 leading-tight mb-4 md:mb-6">
        {{ get('hero', 'hero_title_line1', '指尖上的') }}<br><span class="shimmer-text">{{ get('hero', 'hero_title_line2', '艺术奢享') }}</span>
      </h1>
      <p
        class="text-base md:text-xl mb-8 md:mb-10 max-w-xl mx-auto leading-relaxed"
        style="color: var(--text-muted)"
      >
        {{ get('hero', 'hero_desc', '每一次雕琢都是对美的致敬在LUXE NAIL，让指尖绽放独一无二的光芒') }}
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
        <button
          class="btn-primary text-sm md:text-base w-full sm:w-auto px-8 py-3.5 md:px-10 md:py-4 flex items-center justify-center gap-2"
          @click="openBooking()"
        >
          <i class="fa-solid fa-wand-magic-sparkles" /> 预约美甲服务
        </button>
        <a
          href="#services"
          class="btn-outline text-sm md:text-base w-full sm:w-auto px-8 py-3.5 md:px-8 md:py-4 flex items-center justify-center gap-2"
        >
          <i class="fa-solid fa-eye" /> 浏览服务
        </a>
      </div>
      <div class="mt-10 md:mt-16 flex items-center justify-center gap-6 md:gap-16 text-center">
        <div>
          <div class="font-display text-2xl md:text-3xl font-bold" style="color: var(--accent)">{{ get('hero', 'hero_stat1_value', '6+') }}</div>
          <div class="text-[10px] md:text-xs mt-1" style="color: var(--text-muted)">{{ get('hero', 'hero_stat1_label', '年专业经验') }}</div>
        </div>
        <div style="width: 1px; height: 30px; background: var(--border)" />
        <div>
          <div class="font-display text-2xl md:text-3xl font-bold" style="color: var(--gold)">{{ get('hero', 'hero_stat2_value', '5000+') }}</div>
          <div class="text-[10px] md:text-xs mt-1" style="color: var(--text-muted)">{{ get('hero', 'hero_stat2_label', '满意客户') }}</div>
        </div>
        <div style="width: 1px; height: 30px; background: var(--border)" />
        <div>
          <div class="font-display text-2xl md:text-3xl font-bold" style="color: var(--accent-light)">{{ get('hero', 'hero_stat3_value', '4.9') }}</div>
          <div class="text-[10px] md:text-xs mt-1" style="color: var(--text-muted)">{{ get('hero', 'hero_stat3_label', '平均评分') }}</div>
        </div>
      </div>
    </div>

    <!-- Bounce Arrow -->
    <div class="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
      <a
        href="#services"
        class="flex flex-col items-center gap-1 animate-bounce no-underline pointer-events-auto"
        style="color: var(--text-muted); cursor: pointer"
      >
        <span class="text-[10px]">向下探索</span>
        <i class="fa-solid fa-chevron-down text-[10px]" />
      </a>
    </div>
  </header>
</template>
