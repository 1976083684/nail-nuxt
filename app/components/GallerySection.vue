<script setup lang="ts">
const { get } = useSiteContent()
const { currentUser, loginCallback } = useAuth()
const { openLogin, openImagePreview } = useModal()
const { showToast } = useToast()

const galleryFilter = ref('all')
const galleryPage = ref(1)
const PER_PAGE = 8

// 从数据库加载分类
const { data: categoriesData } = await useFetch('/api/gallery-categories')
const categories = computed(() => (categoriesData.value as any[]) || [])

const { data: galleryData, refresh } = await useFetch('/api/gallery', {
  query: computed(() => ({
    categoryId: galleryFilter.value,
    page: galleryPage.value,
    perPage: PER_PAGE,
    userId: currentUser.value?.id || '',
  })),
})

const items = computed(() => (galleryData.value as any)?.items || [])
const total = computed(() => (galleryData.value as any)?.total || 0)
const totalPages = computed(() => Math.ceil(total.value / PER_PAGE))

function setFilter(catId: string) {
  if (galleryFilter.value === catId) return
  galleryFilter.value = catId
  galleryPage.value = 1
}

function gotoPage(p: number) {
  galleryPage.value = Math.max(1, Math.min(totalPages.value, p))
  document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function toggleLike(itemId: number) {
  if (!currentUser.value) {
    loginCallback.value = () => doLike(itemId)
    openLogin()
    return
  }
  doLike(itemId)
}

async function doLike(itemId: number) {
  try {
    await $fetch(`/api/gallery/${itemId}/like`, {
      method: 'POST',
      body: { userId: currentUser.value?.id },
    })
    refresh()
  } catch {}
}
</script>

<template>
  <section id="gallery" class="py-16 md:py-24 px-4 md:px-6">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-10 md:mb-16 reveal">
        <p class="text-xs tracking-[.2em] uppercase mb-2" style="color: var(--accent-light)">{{ get('gallery', 'gallery_subtitle', 'Gallery') }}</p>
        <h2 class="font-display text-3xl md:text-5xl font-bold mb-3">{{ get('gallery', 'gallery_title', '作品画廊') }}</h2>
        <p style="color: var(--text-muted)" class="text-sm md:text-base max-w-lg mx-auto">
          {{ get('gallery', 'gallery_desc', '每一件作品都是匠心与创意的结晶') }}
        </p>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap justify-center gap-2 mb-8">
        <div
          class="filter-tag"
          :class="{ active: galleryFilter === 'all' }"
          @click="setFilter('all')"
        >
          全部
        </div>
        <div
          v-for="cat in categories"
          :key="cat.id"
          class="filter-tag"
          :class="{ active: galleryFilter === String(cat.id) }"
          @click="setFilter(String(cat.id))"
        >
          {{ cat.name }}
        </div>
      </div>

      <!-- Grid -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4" id="galleryGrid">
        <div
          v-for="item in items"
          :key="item.id"
          class="gallery-item gi-in"
          @click="openImagePreview(item.image_url)"
        >
          <img :src="item.image_url" :alt="item.title" loading="lazy">
          <button
            class="like-btn"
            :class="{ liked: item.liked }"
            @click.stop="toggleLike(item.id)"
          >
            <i :class="item.liked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'" />
            <span class="like-count">{{ item.likeCount || 0 }}</span>
          </button>
          <div class="overlay">
            <div>
              <p class="text-xs md:text-sm font-bold text-white">{{ item.title }}</p>
              <p class="text-[10px] md:text-xs" style="color: var(--accent-light)">{{ item.category_name }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-8">
        <button
          class="page-btn"
          :disabled="galleryPage <= 1"
          @click="gotoPage(galleryPage - 1)"
        >
          <i class="fa-solid fa-chevron-left text-xs" />
        </button>
        <div
          v-for="p in totalPages"
          :key="p"
          class="page-btn"
          :class="{ active: galleryPage === p }"
          @click="gotoPage(p)"
        >
          {{ p }}
        </div>
        <button
          class="page-btn"
          :disabled="galleryPage >= totalPages"
          @click="gotoPage(galleryPage + 1)"
        >
          <i class="fa-solid fa-chevron-right text-xs" />
        </button>
      </div>
    </div>
  </section>
</template>
