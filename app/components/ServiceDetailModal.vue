<script setup lang="ts">
const { showServiceDetail, closeServiceDetail, selectedServiceId, openBooking, openLogin } = useModal()
const { resetBooking } = useBooking()
const { currentUser, loginCallback } = useAuth()

const { data: services } = await useFetch('/api/services')

const service = computed(() => {
  return (services.value as any[])?.find(s => s.id === selectedServiceId.value)
})

const curSlide = ref(0)

watch(showServiceDetail, (val) => {
  if (val) curSlide.value = 0
})

function slide(dir: number) {
  if (!service.value) return
  curSlide.value = Math.max(0, Math.min(service.value.images.length - 1, curSlide.value + dir))
}

function goSlide(i: number) {
  curSlide.value = i
}

function handleBook() {
  if (!service.value) return
  if (!currentUser.value) {
    loginCallback.value = () => {
      resetBooking({ serviceId: service.value!.id })
      closeServiceDetail()
      openBooking()
    }
    openLogin()
    return
  }
  resetBooking({ serviceId: service.value.id })
  closeServiceDetail()
  openBooking()
}
</script>

<template>
  <div class="modal-overlay" :class="{ active: showServiceDetail }" @click.self="closeServiceDetail()">
    <div class="modal-panel" style="max-width: 640px" @click.stop>
      <div v-if="service">
        <!-- Image Slider -->
        <div class="detail-slider">
          <div
            class="detail-slider-track"
            :style="{ transform: `translateX(-${curSlide * 100}%)` }"
          >
            <img v-for="(img, i) in service.images" :key="i" :src="img" :alt="service.name" loading="lazy">
          </div>
          <button class="slider-btn" style="left: 8px" @click="slide(-1)">
            <i class="fa-solid fa-chevron-left" />
          </button>
          <button class="slider-btn" style="right: 8px" @click="slide(1)">
            <i class="fa-solid fa-chevron-right" />
          </button>
          <div class="absolute bottom-3 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full" style="background: rgba(0, 0, 0, 0.5)">
            <span class="text-[10px] text-white">{{ curSlide + 1 }} / {{ service.images?.length }}</span>
          </div>
        </div>
        <div class="slider-dots">
          <div
            v-for="(_, i) in service.images"
            :key="i"
            class="slider-dot"
            :class="{ active: curSlide === i }"
            @click="goSlide(i)"
          />
        </div>

        <!-- Content -->
        <div class="p-5 md:p-6">
          <div class="flex items-start justify-between mb-3">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: var(--svc-icon-bg); color: var(--accent)">
                  <i :class="`fa-solid ${service.icon} text-sm`" />
                </div>
                <h3 class="font-display text-xl font-bold">{{ service.name }}</h3>
              </div>
              <div class="flex items-center gap-3 text-xs" style="color: var(--text-muted)">
                <span><i class="fa-regular fa-clock mr-1" />{{ service.duration }}分钟</span>
                <span><i class="fa-solid fa-star mr-1" style="color: var(--gold)" />4.9</span>
              </div>
            </div>
            <div class="font-display text-2xl font-bold" style="color: var(--accent)">&yen;{{ service.price }}</div>
          </div>

          <p class="text-sm leading-relaxed mb-5" style="color: var(--text-muted)">{{ service.detail }}</p>

          <div class="divider-fancy text-xs mb-4">
            <i class="fa-solid fa-swatchbook" style="color: var(--accent); font-size: 10px" />
          </div>

          <h4 class="font-bold text-sm mb-1">精选样式参考</h4>
          <p class="text-[10px] mb-4" style="color: var(--text-muted)">选择您心仪的款式，预约时可要求复刻</p>

          <div class="grid grid-cols-2 gap-3 mb-5">
            <div
              v-for="(style, i) in service.styles"
              :key="i"
              class="style-card"
            >
              <img :src="style.img" :alt="style.name" loading="lazy">
              <div class="sc-overlay">
                <p class="sc-name">{{ style.name }}</p>
                <p class="sc-desc">{{ style.desc }}</p>
              </div>
            </div>
          </div>

          <button class="btn-primary w-full flex items-center justify-center gap-2" @click="handleBook()">
            <i class="fa-solid fa-calendar-plus" /> 立即预约此服务
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
