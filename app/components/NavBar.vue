<script setup lang="ts">
const { currentUser, logout } = useAuth()
const { openLogin, openBooking, openMyAppointments } = useModal()
const { resetBooking } = useBooking()
const { showToast } = useToast()
const scrolled = ref(false)
const mobileMenuOpen = ref(false)

function onScroll() {
  scrolled.value = window.scrollY > 40
}

function openMobileMenu() {
  mobileMenuOpen.value = true
  document.body.style.overflow = 'hidden'
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
  document.body.style.overflow = ''
}

function handleLogout() {
  logout()
  closeMobileMenu()
  showToast('已退出登录', 'info')
}

onMounted(() => {
  window.addEventListener('scroll', onScroll)
  onScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <div>
    <!-- Mobile Overlay -->
    <div class="mobile-overlay" :class="{ active: mobileMenuOpen }" @click="closeMobileMenu" />

    <!-- Mobile Menu -->
    <div class="mobile-menu" :class="{ active: mobileMenuOpen }">
      <button
        class="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center"
        style="background: var(--border); color: var(--text-muted)"
        @click="closeMobileMenu"
      >
        <i class="fa-solid fa-xmark" />
      </button>

      <div class="mb-6 pb-4" style="border-bottom: 1px solid var(--border)">
        <template v-if="currentUser">
          <div class="flex items-center gap-3">
            <img :src="currentUser.avatar" class="w-12 h-12 rounded-full border-2" style="border-color: var(--accent)">
            <div>
              <p class="font-bold text-sm">{{ currentUser.name }}</p>
              <p class="text-[10px]" style="color: var(--text-muted)">已登录</p>
            </div>
          </div>
          <button class="mt-3 text-xs" style="color: var(--danger)" @click="handleLogout">
            <i class="fa-solid fa-right-from-bracket mr-1" />退出
          </button>
        </template>
        <template v-else>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full flex items-center justify-center" style="background: var(--border)">
              <i class="fa-solid fa-user" style="color: var(--text-muted)" />
            </div>
            <div>
              <p class="text-sm" style="color: var(--text-muted)">未登录</p>
              <button class="text-xs font-bold" style="color: var(--accent)" @click="closeMobileMenu(); openLogin()">
                点击登录
              </button>
            </div>
          </div>
        </template>
      </div>

      <div class="flex flex-col gap-5 text-base">
        <a href="#services" style="color: var(--text-muted)" @click="closeMobileMenu">服务项目</a>
        <a href="#artists" style="color: var(--text-muted)" @click="closeMobileMenu">美甲师</a>
        <a href="#gallery" style="color: var(--text-muted)" @click="closeMobileMenu">作品展示</a>
        <div style="border-top: 1px solid var(--border); padding-top: 16px">
          <p class="text-xs font-bold mb-3" style="color: var(--text-muted)">
            <i class="fa-solid fa-palette mr-1" />系统风格
          </p>
          <ThemePanel mode="trigger" />
        </div>
        <div style="height: 1px; background: var(--border)" />
        <a
          href="#"
          class="flex items-center gap-3"
          style="color: var(--text-muted)"
          @click.prevent="closeMobileMenu(); openMyAppointments()"
        >
          <i class="fa-regular fa-calendar-check" /> 我的预约
        </a>
        <button class="btn-primary w-full mt-2" @click="closeMobileMenu(); resetBooking(); openBooking()">立即预约</button>
      </div>
    </div>

    <!-- Nav Bar -->
    <nav class="nav-bar" :class="{ scrolled }">
      <div class="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
        <a href="#" class="flex items-center gap-2 md:gap-3">
          <div
            class="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center"
            style="background: linear-gradient(135deg, var(--accent), var(--gold))"
          >
            <i class="fa-solid fa-sparkles text-xs" style="color: var(--btn-text)" />
          </div>
          <span class="font-display text-lg md:text-xl font-bold tracking-wider">LUXE NAIL</span>
        </a>

        <div class="hidden md:flex items-center gap-8 text-sm" style="color: var(--text-muted)">
          <a href="#services" class="hover:text-[var(--text)] transition-colors">服务项目</a>
          <a href="#artists" class="hover:text-[var(--text)] transition-colors">美甲师</a>
          <a href="#gallery" class="hover:text-[var(--text)] transition-colors">作品展示</a>
          <button class="hover:text-[var(--text)] transition-colors flex items-center gap-2" @click="openMyAppointments()">
            <i class="fa-regular fa-calendar-check" /> 我的预约
          </button>
        </div>

        <div class="flex items-center gap-2 md:gap-3">
          <!-- User Area -->
          <template v-if="currentUser">
            <div class="flex items-center gap-2">
              <img :src="currentUser.avatar" class="user-avatar" @click="openMyAppointments()">
              <button
                class="hidden md:block text-xs"
                style="color: var(--text-muted)"
                @click="logout(); showToast('已退出登录', 'info')"
              >
                <i class="fa-solid fa-right-from-bracket mr-1" />退出
              </button>
            </div>
          </template>
          <template v-else>
            <button
              class="hidden md:flex items-center gap-1.5 text-xs"
              style="color: var(--text-muted)"
              @click="openLogin()"
            >
              <i class="fa-solid fa-right-to-bracket" />登录
            </button>
          </template>

          <ThemePanel mode="button" />

          <button class="btn-primary btn-sm hidden md:flex items-center gap-2 text-xs md:text-sm" @click="resetBooking(); openBooking()">
            <i class="fa-solid fa-calendar-plus" /><span>立即预约</span>
          </button>

          <button
            class="md:hidden w-9 h-9 rounded-lg flex items-center justify-center"
            style="background: var(--bg-card); color: var(--text-muted); border: 1px solid var(--border)"
            @click="openMobileMenu()"
          >
            <i class="fa-solid fa-bars" />
          </button>
        </div>
      </div>
    </nav>
  </div>
</template>
