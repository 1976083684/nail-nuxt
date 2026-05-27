<script setup lang="ts">
const { initTheme } = useTheme()
const { initAuth } = useAuth()
const { closeAll } = useModal()

// 初始化
onMounted(() => {
  initTheme()
  initAuth()

  // ESC 关闭所有弹窗
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') closeAll()
  }
  document.addEventListener('keydown', handler)
  onUnmounted(() => document.removeEventListener('keydown', handler))

  // Reveal 动画
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('visible')
      })
    },
    { threshold: 0.05, rootMargin: '0px 0px -30px 0px' }
  )
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
  onUnmounted(() => observer.disconnect())
})
</script>

<template>
  <div>
    <NavBar />
    <HeroSection />
    <ServicesSection />
    <ArtistsSection />
    <GallerySection />
    <CtaSection />
    <FooterSection />

    <!-- Modals -->
    <LoginModal />
    <ServiceDetailModal />
    <ArtistDetailModal />
    <BookingModal />
    <MyAppointmentsModal />
    <ImagePreviewModal />
    <Toast />
  </div>
</template>
