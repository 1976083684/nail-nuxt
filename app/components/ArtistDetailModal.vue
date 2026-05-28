<script setup lang="ts">
const { showArtistDetail, closeArtistDetail, selectedArtistId, openImagePreview, openBooking, openLogin } = useModal()
const { resetBooking } = useBooking()
const { currentUser, loginCallback } = useAuth()

const { data: artists } = await useFetch('/api/artists')

const artist = computed(() => {
  return (artists.value as any[])?.find(a => a.id === selectedArtistId.value)
})

function handleBook() {
  if (!artist.value) return
  if (!currentUser.value) {
    loginCallback.value = () => {
      resetBooking({ artistId: artist.value!.id })
      openBooking()
    }
    closeArtistDetail()
    openLogin()
    return
  }
  resetBooking({ artistId: artist.value.id })
  closeArtistDetail()
  openBooking()
}
</script>

<template>
  <div class="modal-overlay" :class="{ active: showArtistDetail }" @click.self="closeArtistDetail()">
    <div class="modal-panel" style="max-width: 520px" @click.stop>
      <div v-if="artist">
        <div class="relative">
          <img :src="artist.image_url" :alt="artist.name" class="w-full aspect-[4/3] object-cover" style="border-radius: 20px 20px 0 0">
          <div class="absolute inset-0" style="background: linear-gradient(transparent 40%, var(--overlay-bg)); border-radius: 20px 20px 0 0" />
          <button
            class="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
            style="background: rgba(0, 0, 0, 0.4); color: #fff"
            @click="closeArtistDetail()"
          >
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <div class="p-5 md:p-6">
          <div class="flex items-center gap-4 mb-4">
            <img :src="artist.image_url" class="w-16 h-16 rounded-full object-cover border-2" style="border-color: var(--accent)">
            <div>
              <h3 class="font-display text-xl font-bold">{{ artist.name }}</h3>
              <p class="text-sm" style="color: var(--accent)">{{ artist.title }}</p>
              <div class="flex items-center gap-3 mt-1">
                <div class="stars text-xs"><i class="fa-solid fa-star" /> {{ artist.rating }}</div>
                <span class="text-xs" style="color: var(--text-muted)">{{ artist.experience_years }}年经验</span>
              </div>
            </div>
          </div>

          <p class="text-sm leading-relaxed mb-4" style="color: var(--text-muted)">{{ artist.bio }}</p>

          <div class="mb-4">
            <p class="text-xs font-bold mb-2">
              <i class="fa-solid fa-wand-magic-sparkles mr-1" style="color: var(--accent)" />擅长领域
            </p>
            <p class="text-sm" style="color: var(--text-muted)">{{ artist.specialty }}</p>
          </div>

          <div class="mb-4">
            <p class="text-xs font-bold mb-2">
              <i class="fa-solid fa-certificate mr-1" style="color: var(--gold)" />资质认证
            </p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="cert in artist.certs"
                :key="cert"
                class="text-[10px] px-2.5 py-1 rounded-full"
                style="background: var(--svc-icon-bg); color: var(--accent); border: 1px solid var(--border)"
              >
                {{ cert }}
              </span>
            </div>
          </div>

          <div class="mb-5">
            <p class="text-xs font-bold mb-2">
              <i class="fa-solid fa-images mr-1" style="color: var(--accent-light)" />代表作品
            </p>
            <div class="flex gap-2">
              <img
                v-for="(work, i) in artist.works"
                :key="i"
                :src="work"
                class="w-20 h-20 rounded-lg object-cover cursor-pointer transition-transform hover:scale-105"
                loading="lazy"
                @click="openImagePreview(work)"
              >
            </div>
          </div>

          <button class="btn-primary w-full flex items-center justify-center gap-2" @click="handleBook()">
            <i class="fa-solid fa-calendar-plus" /> 预约{{ artist.name }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
