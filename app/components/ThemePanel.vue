<script setup lang="ts">
const props = defineProps<{ mode: 'button' | 'trigger' }>()

const { currentTheme, applyTheme, THEMES } = useTheme()
const panelOpen = ref(false)
const popupOpen = ref(false)

function togglePanel() {
  panelOpen.value = !panelOpen.value
  if (panelOpen.value) {
    setTimeout(() => {
      const handler = (e: MouseEvent) => {
        if (!(e.target as HTMLElement).closest('.theme-panel') && !(e.target as HTMLElement).closest('[data-theme-toggle]')) {
          panelOpen.value = false
          document.removeEventListener('click', handler)
        }
      }
      document.addEventListener('click', handler)
    }, 10)
  }
}

function openPopup() {
  popupOpen.value = true
  document.body.style.overflow = 'hidden'
}

function closePopup() {
  popupOpen.value = false
  document.body.style.overflow = ''
}

function selectTheme(id: string) {
  applyTheme(id)
  panelOpen.value = false
  closePopup()
}
</script>

<template>
  <!-- PC Theme Button -->
  <template v-if="mode === 'button'">
    <div class="relative">
      <button
        data-theme-toggle
        class="w-9 h-9 rounded-lg hidden md:flex items-center justify-center"
        style="background: var(--bg-card); color: var(--text-muted); border: 1px solid var(--border)"
        title="切换风格"
        @click="togglePanel()"
      >
        <i class="fa-solid fa-palette text-sm" />
      </button>

      <!-- PC Dropdown Panel -->
      <div class="theme-panel" :class="{ active: panelOpen }">
        <p class="text-xs font-bold mb-3" style="color: var(--text-muted)">
          <i class="fa-solid fa-palette mr-1" />切换风格
        </p>
        <div class="space-y-2">
          <div
            v-for="(theme, id) in THEMES"
            :key="id"
            class="theme-option"
            :class="{ active: currentTheme === id }"
            @click="selectTheme(id as string)"
          >
            <div class="theme-dots">
              <span v-for="c in theme.colors.slice(0, 3)" :key="c" :style="{ background: c }" />
            </div>
            <span class="theme-label">{{ theme.name }}</span>
            <i class="fa-solid fa-check theme-check" />
          </div>
        </div>
      </div>
    </div>
  </template>

  <!-- Mobile Theme Trigger -->
  <template v-if="mode === 'trigger'">
    <div>
      <div class="theme-trigger" @click="openPopup()">
        <div class="tt-dots">
          <span
            v-for="c in THEMES[currentTheme]?.colors.slice(0, 3) || []"
            :key="c"
            :style="{ background: c }"
          />
        </div>
        <span class="tt-name">{{ THEMES[currentTheme]?.name }}</span>
        <i class="fa-solid fa-chevron-right tt-arrow" />
      </div>

      <!-- Mobile Popup -->
      <div class="theme-popup-overlay" :class="{ active: popupOpen }" @click="closePopup()" />
      <div class="theme-popup" :class="{ active: popupOpen }">
        <div class="theme-popup-handle" />
        <div class="theme-popup-title">
          <i class="fa-solid fa-palette mr-2" style="color: var(--accent)" />选择系统风格
        </div>
        <div
          v-for="(theme, id) in THEMES"
          :key="id"
          class="theme-card"
          :class="{ active: currentTheme === id }"
          @click="selectTheme(id as string)"
        >
          <div class="tc-preview">
            <span v-for="c in theme.colors" :key="c" :style="{ background: c }" />
          </div>
          <div class="tc-info">
            <div class="tc-name">{{ theme.name }}</div>
            <div class="tc-palette">{{ theme.colors.slice(0, 3).join(' / ') }}</div>
          </div>
          <div class="tc-check" />
        </div>
      </div>
    </div>
  </template>
</template>
