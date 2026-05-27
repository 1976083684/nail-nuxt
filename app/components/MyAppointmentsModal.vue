<script setup lang="ts">
const { showMyAppointments, closeMyAppointments, openBooking } = useModal()
const { currentUser } = useAuth()
const { showToast } = useToast()

const { data: appointments, refresh } = await useFetch('/api/appointments', {
  query: computed(() => ({
    userId: currentUser.value?.id || '',
  })),
  immediate: false,
})

watch(showMyAppointments, async (val) => {
  if (val && currentUser.value) {
    await refresh()
  }
})

const sortedAppointments = computed(() => {
  return [...((appointments.value as any[]) || [])].sort((a, b) => b.id - a.id)
})

function statusBadge(status: string) {
  const map: Record<string, { class: string; text: string }> = {
    upcoming: { class: 'badge-upcoming', text: '即将到来' },
    completed: { class: 'badge-completed', text: '已完成' },
    cancelled: { class: 'badge-cancelled', text: '已取消' },
  }
  return map[status] || map.upcoming
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const w = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getMonth() + 1}月${d.getDate()}日 ${w[d.getDay()]}`
}

async function cancelAppointment(id: number) {
  try {
    await $fetch(`/api/appointments/${id}/cancel`, { method: 'POST' })
    await refresh()
    showToast('预约已取消', 'info')
  } catch {
    showToast('取消失败', 'error')
  }
}
</script>

<template>
  <div class="modal-overlay" :class="{ active: showMyAppointments }" @click.self="closeMyAppointments()">
    <div class="modal-panel p-0" style="max-width: 560px" @click.stop>
      <div class="flex items-center justify-between p-4 md:p-6 pb-3" style="border-bottom: 1px solid var(--border)">
        <h3 class="font-display text-lg md:text-xl font-bold">我的预约</h3>
        <button
          class="w-8 h-8 rounded-full flex items-center justify-center"
          style="background: var(--bg); color: var(--text-muted)"
          @click="closeMyAppointments()"
        >
          <i class="fa-solid fa-xmark" />
        </button>
      </div>

      <div class="p-4 md:p-6" style="max-height: 60vh; overflow-y: auto">
        <template v-if="sortedAppointments.length">
          <div v-for="appt in sortedAppointments" :key="appt.id" class="appt-card mb-2.5">
            <div class="flex items-start justify-between mb-2">
              <div>
                <span class="font-bold text-sm">{{ appt.serviceName }}</span>
                <span class="text-[10px] ml-1.5" style="color: var(--text-muted)">&yen;{{ appt.servicePrice }}</span>
              </div>
              <span class="badge" :class="statusBadge(appt.status).class">
                {{ statusBadge(appt.status).text }}
              </span>
            </div>
            <div class="grid grid-cols-2 gap-1.5 text-[10px] md:text-xs" style="color: var(--text-muted)">
              <div><i class="fa-solid fa-user mr-1" style="color: var(--accent)" />{{ appt.artistName || '随机分配' }}</div>
              <div><i class="fa-regular fa-calendar mr-1" style="color: var(--accent)" />{{ formatDate(appt.date) }}</div>
              <div><i class="fa-regular fa-clock mr-1" style="color: var(--accent)" />{{ appt.time }}</div>
              <div><i class="fa-solid fa-phone mr-1" style="color: var(--accent)" />{{ appt.customer_phone }}</div>
            </div>
            <div v-if="appt.status === 'upcoming'" class="mt-2.5 pt-2 flex justify-end" style="border-top: 1px solid var(--border)">
              <button
                class="text-[10px] md:text-xs px-3 py-1.5 rounded-lg"
                style="color: var(--danger); background: rgba(196, 64, 64, 0.06)"
                @click="cancelAppointment(appt.id)"
              >
                <i class="fa-solid fa-xmark mr-1" />取消预约
              </button>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="text-center py-10">
            <i class="fa-regular fa-calendar-xmark text-3xl mb-3" style="color: var(--text-muted)" />
            <p class="text-xs" style="color: var(--text-muted)">暂无预约记录</p>
            <button class="btn-primary btn-sm mt-4 text-xs" @click="closeMyAppointments(); openBooking()">
              立即预约
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
