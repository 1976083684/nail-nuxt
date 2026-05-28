<script setup lang="ts">
const { get } = useSiteContent()
const { data: artists } = await useFetch('/api/artists')
const { openArtistDetail, openBooking, openLogin } = useModal()
const { resetBooking } = useBooking()
const { currentUser, loginCallback } = useAuth()

function handleBookArtist(id: number) {
  if (!currentUser.value) {
    loginCallback.value = () => {
      resetBooking({ artistId: id })
      openBooking()
    }
    openLogin()
    return
  }
  resetBooking({ artistId: id })
  openBooking()
}

function toggleOverlay(e: MouseEvent) {
  if (window.innerWidth >= 768) return
  e.stopPropagation()
  const card = (e.currentTarget as HTMLElement)
  const overlay = card.querySelector('.artist-overlay') as HTMLElement
  if (!overlay) return
  const isShown = overlay.classList.contains('show-overlay')
  document.querySelectorAll('.artist-overlay.show-overlay').forEach(o => o.classList.remove('show-overlay'))
  if (!isShown) overlay.classList.add('show-overlay')
}
</script>

<template>
  <section id="artists" class="py-16 md:py-24 px-4 md:px-6" style="background: linear-gradient(180deg, transparent, var(--glow1), transparent)">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-10 md:mb-16 reveal">
        <p class="text-xs tracking-[.2em] uppercase mb-2" style="color: var(--gold)">{{ get('artists', 'artists_subtitle', 'Our Artists') }}</p>
        <h2 class="font-display text-3xl md:text-5xl font-bold mb-3">{{ get('artists', 'artists_title', '资深美甲师团队') }}</h2>
        <p style="color: var(--text-muted)" class="text-sm md:text-base max-w-lg mx-auto">
          {{ get('artists', 'artists_desc', '每位美甲师都经过严格甄选，为你带来极致体验') }}
        </p>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <div
          v-for="art in (artists as any[])"
          :key="art.id"
          class="card artist-card reveal"
          @click="toggleOverlay($event)"
        >
          <div class="h-48 md:h-64 overflow-hidden">
            <img
              :src="art.image_url"
              :alt="art.name"
              class="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
            >
          </div>
          <div class="artist-overlay">
            <p class="text-white font-bold text-sm mb-1">{{ art.name }}</p>
            <p class="text-white/70 text-[10px] mb-2">{{ art.title }}</p>
            <button class="ao-btn ao-detail" @click.stop="openArtistDetail(art.id)">
              <i class="fa-solid fa-user mr-1" />查看详情
            </button>
            <button class="ao-btn ao-book" @click.stop="handleBookArtist(art.id)">
              <i class="fa-solid fa-calendar-plus mr-1" />立即预约
            </button>
          </div>
          <div class="p-3 md:p-4">
            <div class="flex items-center justify-between mb-1">
              <h3 class="font-bold text-sm md:text-base">{{ art.name }}</h3>
              <div class="stars text-[10px] md:text-xs">
                <i class="fa-solid fa-star" /> {{ art.rating }}
              </div>
            </div>
            <p class="text-[10px] md:text-xs" style="color: var(--accent)">{{ art.title }}</p>
            <p class="text-[10px] md:text-xs mt-0.5" style="color: var(--text-muted)">
              <i class="fa-solid fa-briefcase mr-1" />{{ art.experience_years }}年经验
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
