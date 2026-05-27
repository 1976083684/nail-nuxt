<script setup lang="ts">
const { get } = useSiteContent()
</script>

<template>
  <footer class="py-8 md:py-12 px-4 md:px-6" style="border-top: 1px solid var(--border)">
    <div class="max-w-7xl mx-auto flex flex-col items-center gap-4 text-xs md:text-sm" style="color: var(--text-muted)">
      <div class="flex items-center gap-2">
        <div
          class="w-6 h-6 rounded-full flex items-center justify-center"
          style="background: linear-gradient(135deg, var(--accent), var(--gold))"
        >
          <i class="fa-solid fa-sparkles" style="color: var(--btn-text); font-size: 8px" />
        </div>
        <span class="font-display font-bold text-sm" style="color: var(--text)">LUXE NAIL</span>
      </div>
      <div class="flex flex-col md:flex-row items-center gap-2 md:gap-6 text-center">
        <span><i class="fa-solid fa-location-dot mr-1" style="color: var(--accent)" />{{ get('footer', 'footer_address', '上海市静安区南京西路1688号') }}</span>
        <span><i class="fa-solid fa-phone mr-1" style="color: var(--accent)" />{{ get('footer', 'footer_phone', '021-6288-8888') }}</span>
      </div>
    </div>
  </footer>
</template>
