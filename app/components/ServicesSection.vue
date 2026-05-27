<script setup lang="ts">
const { get } = useSiteContent()
const { data: services } = await useFetch('/api/services')
const { openServiceDetail, openBooking } = useModal()
const { resetBooking } = useBooking()
const { currentUser, loginCallback } = useAuth()

function handleBookService(id: number) {
  if (!currentUser.value) {
    loginCallback.value = () => {
      resetBooking({ serviceId: id })
      openBooking()
    }
    return
  }
  resetBooking({ serviceId: id })
  openBooking()
}
</script>

<template>
  <section id="services" class="py-16 md:py-24 px-4 md:px-6">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-10 md:mb-16 reveal">
        <p class="text-xs tracking-[.2em] uppercase mb-2" style="color: var(--accent)">{{ get('services', 'services_subtitle', 'Our Services') }}</p>
        <h2 class="font-display text-3xl md:text-5xl font-bold mb-3">{{ get('services', 'services_title', '精选服务项目') }}</h2>
        <p style="color: var(--text-muted)" class="text-sm md:text-base max-w-lg mx-auto">
          {{ get('services', 'services_desc', '从经典护理到前沿艺术，找到属于你的指尖风格') }}
        </p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div
          v-for="svc in (services as any[])"
          :key="svc.id"
          class="card reveal"
          style="cursor: pointer; overflow: hidden"
          @click="openServiceDetail(svc.id)"
        >
          <div class="svc-img-wrap">
            <img :src="svc.images?.[0]" :alt="svc.name" loading="lazy">
            <span class="svc-img-badge">
              <i class="fa-regular fa-images mr-1" />{{ svc.images?.length || 0 }}张
            </span>
          </div>
          <div class="p-4 md:p-5">
            <div class="flex items-center gap-2 mb-2">
              <div
                class="w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style="background: var(--svc-icon-bg); color: var(--accent)"
              >
                <i :class="`fa-solid ${svc.icon} text-sm`" />
              </div>
              <h3 class="text-base md:text-lg font-bold">{{ svc.name }}</h3>
            </div>
            <p class="text-xs md:text-sm mb-3" style="color: var(--text-muted)">{{ svc.description }}</p>
            <div class="flex items-center justify-between mb-3">
              <span class="font-display text-lg md:text-xl font-bold" style="color: var(--accent)">
                &yen;{{ svc.price }}
              </span>
              <span class="text-[10px] md:text-xs" style="color: var(--text-muted)">
                <i class="fa-regular fa-clock mr-1" />{{ svc.duration }}分钟
              </span>
            </div>
            <div class="flex gap-2">
              <button
                class="flex-1 text-xs py-2.5 rounded-lg font-medium flex items-center justify-center gap-1.5"
                style="background: var(--svc-icon-bg); color: var(--accent); border: 1px solid var(--border)"
                @click.stop="openServiceDetail(svc.id)"
              >
                <i class="fa-solid fa-eye" /> 详情
              </button>
              <button
                class="flex-1 btn-primary btn-sm text-xs flex items-center justify-center gap-1.5"
                @click.stop="handleBookService(svc.id)"
              >
                <i class="fa-solid fa-calendar-plus" /> 预约
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
