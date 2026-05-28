<script setup lang="ts">
const { showBooking, closeBooking } = useModal()
const { currentUser } = useAuth()
const { showToast } = useToast()
const { bookingState, STEP_LABELS, STEP_COUNT, TIME_SLOTS, resetBooking, nextStep, prevStep, dateToString, formatDateDisplay } = useBooking()

const { data: services } = await useFetch('/api/services')
const { data: artists } = await useFetch('/api/artists')
const { data: siteSettings } = await useFetch<any[]>('/api/admin/settings')

// 美甲师排班数据
const artistScheduleData = ref<any>(null)

const bookingFee = computed(() => {
  const fee = siteSettings.value?.find((s: any) => s.setting_key === 'booking_fee')
  return Number(fee?.setting_value) || 5
})

const cancelHours = computed(() => {
  const h = siteSettings.value?.find((s: any) => s.setting_key === 'cancel_hours')
  return Number(h?.setting_value) || 6
})

// 预约表单数据
const name = ref('')
const phone = ref('')
const note = ref('')

watch(showBooking, (val) => {
  if (val) {
    name.value = currentUser.value?.name || ''
    phone.value = currentUser.value?.phone || ''
    note.value = ''
    bookingState.value.name = name.value
    bookingState.value.phone = phone.value
  }
})

// 日期时间选择
const availability = ref<any[]>([])

// 获取可用时间段（日期、美甲师、服务变化时重新获取）
async function fetchAvailability() {
  const date = bookingState.value.date
  if (!date) return
  const ds = dateToString(date)
  const artistId = bookingState.value.artistId || 0
  const serviceId = bookingState.value.serviceId || 0
  try {
    availability.value = await $fetch('/api/availability', {
      query: { date: ds, artistId, serviceId },
    })
  } catch {
    availability.value = TIME_SLOTS.map(t => ({ time: t, available: true }))
  }
}

// 获取美甲师排班记录（当月及下月）
async function fetchArtistSchedule() {
  const artistId = bookingState.value.artistId
  if (!artistId || artistId === 0) {
    artistScheduleData.value = null
    return
  }

  const { calYear: y, calMonth: m } = bookingState.value
  // 查询当月1号到下月最后一天
  const startDate = `${y}-${String(m + 1).padStart(2, '0')}-01`
  const nextMonth = m === 11 ? 0 : m + 1
  const nextYear = m === 11 ? y + 1 : y
  const lastDay = new Date(nextYear, nextMonth + 1, 0).getDate()
  const endDate = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${lastDay}`

  try {
    artistScheduleData.value = await $fetch('/api/artist-schedule', {
      query: { artistId, startDate, endDate }
    })
  } catch {
    artistScheduleData.value = null
  }
}

watch(
  [() => bookingState.value.date, () => bookingState.value.artistId],
  () => { fetchAvailability() }
)

// 当选择美甲师或切换月份时，获取排班记录
watch(
  [() => bookingState.value.artistId, () => bookingState.value.calYear, () => bookingState.value.calMonth],
  () => { fetchArtistSchedule() },
  { immediate: true }
)

function selectDate(y: number, m: number, d: number) {
  // 检查该日期是否可预约
  const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const scheduleInfo = artistScheduleData.value?.schedules?.[dateStr]
  if (scheduleInfo && !scheduleInfo.available) {
    return // 不可预约的日期不允许选择
  }
  bookingState.value.date = new Date(y, m, d)
  bookingState.value.time = null
}

// 判断时间段是否已过（仅今天生效）
function isTimePast(time: string): boolean {
  if (!bookingState.value.date) return false
  const now = new Date()
  const selected = bookingState.value.date
  // 只有选中日期是今天时才判断
  if (selected.getFullYear() !== now.getFullYear() ||
      selected.getMonth() !== now.getMonth() ||
      selected.getDate() !== now.getDate()) {
    return false
  }
  const [h, m] = time.split(':').map(Number)
  const slotMinutes = h * 60 + m
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return slotMinutes <= nowMinutes
}

function selectTime(t: string) {
  bookingState.value.time = t
}

function changeMonth(delta: number) {
  bookingState.value.calMonth += delta
  if (bookingState.value.calMonth > 11) {
    bookingState.value.calMonth = 0
    bookingState.value.calYear++
  }
  if (bookingState.value.calMonth < 0) {
    bookingState.value.calMonth = 11
    bookingState.value.calYear--
  }
}

const calendarDays = computed(() => {
  const { calYear: y, calMonth: m } = bookingState.value
  const firstDay = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days: Array<{
    day: number | null
    disabled: boolean
    today: boolean
    selected: boolean
    available: boolean | null  // null=未查询, true=可预约, false=不可预约
    hasSchedule: boolean  // 是否有排班记录
    availableSlots: number
    totalSlots: number
    reason: string
  }> = []

  for (let i = 0; i < firstDay; i++) {
    days.push({ day: null, disabled: true, today: false, selected: false, available: null, hasSchedule: false, availableSlots: 0, totalSlots: 0, reason: '' })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(y, m, d)
    const isPast = dt < today
    const isToday = dt.getTime() === today.getTime()
    const isSelected = bookingState.value.date?.getTime() === dt.getTime()

    // 检查排班数据
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const scheduleInfo = artistScheduleData.value?.schedules?.[dateStr]

    let available: boolean | null = null
    let hasSchedule = false
    let availableSlots = 0
    let totalSlots = 0
    let reason = ''

    if (scheduleInfo) {
      // 有排班记录
      hasSchedule = true
      available = scheduleInfo.available
      availableSlots = scheduleInfo.availableSlots
      totalSlots = scheduleInfo.totalSlots
      reason = scheduleInfo.reason
    } else if (artistScheduleData.value) {
      // 已查询到排班数据，但该日期没有排班记录 → 不可预约，不显示状态点
      available = false
      hasSchedule = false
      reason = '无排班'
    }

    // 如果是过去日期，标记为不可用
    if (isPast) {
      available = false
    }

    days.push({
      day: d,
      disabled: isPast,
      today: isToday,
      selected: isSelected,
      available,
      hasSchedule,
      availableSlots,
      totalSlots,
      reason
    })
  }

  return days
})

// 步骤验证
const canProceed = computed(() => {
  const s = bookingState.value
  switch (s.step) {
    case 0: return s.serviceId !== null
    case 1: return s.artistId !== null
    case 2: return s.date !== null && s.time !== null
    case 3: return name.value.trim() !== '' && /^1\d{10}$/.test(phone.value.trim())
    case 4: return true
    default: return false
  }
})

async function handleNext() {
  const s = bookingState.value

  if (s.step === 3) {
    bookingState.value.name = name.value
    bookingState.value.phone = phone.value
    bookingState.value.note = note.value
  }

  if (s.step === 4) {
    // 提交预约
    try {
      await $fetch('/api/appointments', {
        method: 'POST',
        body: {
          userId: currentUser.value?.id,
          serviceId: s.serviceId,
          artistId: s.artistId === 0 ? null : s.artistId,
          date: dateToString(s.date!),
          time: s.time,
          name: name.value,
          phone: phone.value,
          note: note.value,
        },
      })
      resetBooking()
      closeBooking()
      showToast('预约成功！期待为您服务', 'success')
    } catch (e: any) {
      showToast('预约失败，请重试', 'error')
    }
    return
  }

  nextStep()
}

function handlePrev() {
  prevStep()
}

const selectedService = computed(() => (services.value as any[])?.find(s => s.id === bookingState.value.serviceId))
const selectedArtist = computed(() => {
  if (bookingState.value.artistId === 0) return null
  return (artists.value as any[])?.find(a => a.id === bookingState.value.artistId)
})
</script>

<template>
  <div class="modal-overlay" :class="{ active: showBooking }" @click.self="closeBooking()">
    <div class="modal-panel p-0" @click.stop>
      <!-- Header -->
      <div class="flex items-center justify-between p-4 md:p-6 pb-3" style="border-bottom: 1px solid var(--border)">
        <h3 class="font-display text-lg md:text-xl font-bold">预约美甲服务</h3>
        <button
          class="w-8 h-8 rounded-full flex items-center justify-center"
          style="background: var(--bg); color: var(--text-muted)"
          @click="closeBooking()"
        >
          <i class="fa-solid fa-xmark" />
        </button>
      </div>

      <!-- Step Indicator -->
      <div class="flex items-center gap-1 md:gap-2 px-4 md:px-6 py-3">
        <template v-for="(label, i) in STEP_LABELS" :key="i">
          <div class="flex flex-col items-center gap-1" style="min-width: 32px">
            <div
              class="step-dot"
              :class="{
                done: i < bookingState.step,
                active: i === bookingState.step,
              }"
            />
            <span
              class="text-[9px] md:text-[10px]"
              :style="{ color: i <= bookingState.step ? 'var(--accent)' : 'var(--text-muted)' }"
            >
              {{ label }}
            </span>
          </div>
          <div v-if="i < STEP_COUNT - 1" class="step-line" :class="{ done: i < bookingState.step }" />
        </template>
      </div>

      <!-- Step Content -->
      <div class="p-4 md:p-6 pt-1 md:pt-2 min-h-[300px] md:min-h-[340px]">
        <!-- Step 0: 服务选择 -->
        <template v-if="bookingState.step === 0">
          <p class="text-xs md:text-sm mb-3" style="color: var(--text-muted)">选择您想要的美甲服务</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
            <div
              v-for="svc in (services as any[])"
              :key="svc.id"
              class="card p-3 md:p-4 cursor-pointer"
              :class="{ selected: bookingState.serviceId === svc.id }"
              @click="bookingState.serviceId = svc.id"
            >
              <div class="flex items-center gap-2 md:gap-3">
                <div class="w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style="background: var(--svc-icon-bg); color: var(--accent)">
                  <i :class="`fa-solid ${svc.icon} text-sm`" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-sm">{{ svc.name }}</span>
                    <span class="font-display font-bold text-sm" style="color: var(--accent)">&yen;{{ svc.price }}</span>
                  </div>
                  <div class="text-[10px] md:text-xs mt-0.5" style="color: var(--text-muted)">{{ svc.duration }}分钟</div>
                </div>
                <i v-if="bookingState.serviceId === svc.id" class="fa-solid fa-check-circle text-sm flex-shrink-0" style="color: var(--accent)" />
              </div>
            </div>
          </div>
        </template>

        <!-- Step 1: 美甲师选择 -->
        <template v-if="bookingState.step === 1">
          <p class="text-xs md:text-sm mb-3" style="color: var(--text-muted)">选择您偏好的美甲师</p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
            <div
              v-for="art in (artists as any[])"
              :key="art.id"
              class="card p-2 md:p-3 cursor-pointer text-center"
              :class="{ selected: bookingState.artistId === art.id }"
              @click="bookingState.artistId = art.id"
            >
              <img :src="art.image_url" :alt="art.name" class="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover mx-auto mb-1.5">
              <p class="font-bold text-xs md:text-sm">{{ art.name }}</p>
              <p class="text-[10px]" style="color: var(--accent)">{{ art.title }}</p>
              <div class="stars text-[10px] mt-0.5"><i class="fa-solid fa-star" /> {{ art.rating }}</div>
              <i v-if="bookingState.artistId === art.id" class="fa-solid fa-check-circle mt-1 text-xs" style="color: var(--accent)" />
            </div>
            <div
              class="card p-2 md:p-3 cursor-pointer text-center"
              :class="{ selected: bookingState.artistId === 0 }"
              @click="bookingState.artistId = 0"
            >
              <div class="w-12 h-12 md:w-16 md:h-16 rounded-full mx-auto mb-1.5 flex items-center justify-center" style="background: var(--border)">
                <i class="fa-solid fa-shuffle text-sm" style="color: var(--text-muted)" />
              </div>
              <p class="font-bold text-xs md:text-sm">随机分配</p>
              <p class="text-[10px]" style="color: var(--text-muted)">由店内安排</p>
              <i v-if="bookingState.artistId === 0" class="fa-solid fa-check-circle mt-1 text-xs" style="color: var(--accent)" />
            </div>
          </div>
        </template>

        <!-- Step 2: 日期时间选择 -->
        <template v-if="bookingState.step === 2">
          <p class="text-xs md:text-sm mb-3" style="color: var(--text-muted)">选择预约日期和时间</p>
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1">
              <div class="flex items-center justify-between mb-2">
                <button class="w-7 h-7 rounded-lg flex items-center justify-center" style="background: var(--bg); border: 1px solid var(--border); color: var(--text-muted)" @click="changeMonth(-1)">
                  <i class="fa-solid fa-chevron-left text-[10px]" />
                </button>
                <span class="font-bold text-sm">{{ bookingState.calYear }}年{{ bookingState.calMonth + 1 }}月</span>
                <button class="w-7 h-7 rounded-lg flex items-center justify-center" style="background: var(--bg); border: 1px solid var(--border); color: var(--text-muted)" @click="changeMonth(1)">
                  <i class="fa-solid fa-chevron-right text-[10px]" />
                </button>
              </div>
              <div class="grid grid-cols-7 gap-1 text-center mb-1">
                <span v-for="d in ['日','一','二','三','四','五','六']" :key="d" class="text-[10px] md:text-xs" style="color: var(--text-muted)">{{ d }}</span>
              </div>
              <div class="grid grid-cols-7 gap-1">
                <div
                  v-for="(cell, i) in calendarDays"
                  :key="i"
                  class="cal-day"
                  :class="{
                    empty: cell.day === null,
                    disabled: cell.disabled,
                    today: cell.today,
                    selected: cell.selected,
                    'schedule-unavailable': cell.available === false && !cell.disabled,
                    'schedule-available': cell.available === true && !cell.disabled,
                  }"
                  :title="cell.reason || (cell.available === false ? '不可预约' : cell.available === true ? '可预约' : '')"
                  @click="cell.day && !cell.disabled && cell.available !== false && selectDate(bookingState.calYear, bookingState.calMonth, cell.day)"
                >
                  <span>{{ cell.day }}</span>
                  <!-- 只有有排班记录的日子才显示状态点 -->
                  <span v-if="cell.hasSchedule && !cell.disabled" class="schedule-dot" :class="{ 'dot-unavailable': !cell.available }" />
                </div>
              </div>
              <!-- 排班图例 -->
              <div v-if="artistScheduleData && bookingState.artistId && bookingState.artistId !== 0" class="flex items-center gap-3 mt-2 text-[10px]" style="color: var(--text-muted)">
                <div class="flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-green-500" />
                  <span>可约</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-red-500" />
                  <span>不可约</span>
                </div>
              </div>
            </div>
            <div class="sm:w-44">
              <p class="text-[10px] md:text-xs mb-2 font-medium" style="color: var(--text-muted)">
                {{ bookingState.date ? formatDateDisplay(dateToString(bookingState.date)) : '请先选择日期' }}
              </p>
              <div class="grid grid-cols-3 sm:grid-cols-2 gap-1.5">
                <template v-if="bookingState.date">
                  <div
                    v-for="slot in availability"
                    :key="slot.time"
                    class="time-slot"
                    :class="{
                      selected: bookingState.time === slot.time,
                      disabled: !slot.available || isTimePast(slot.time),
                    }"
                    @click="slot.available && !isTimePast(slot.time) && selectTime(slot.time)"
                  >
                    {{ slot.time }}
                  </div>
                </template>
                <p v-else class="text-[10px] col-span-3 sm:col-span-2 text-center py-6" style="color: var(--text-muted)">
                  请先选择日期
                </p>
              </div>
            </div>
          </div>
        </template>

        <!-- Step 3: 联系信息 -->
        <template v-if="bookingState.step === 3">
          <p class="text-xs md:text-sm mb-3" style="color: var(--text-muted)">填写您的联系信息</p>
          <div class="space-y-3 md:space-y-4 max-w-md">
            <div>
              <label class="block text-[10px] md:text-xs font-medium mb-1.5" style="color: var(--text-muted)">
                姓名 <span style="color: var(--danger)">*</span>
              </label>
              <input v-model="name" type="text" class="form-input" placeholder="请输入您的姓名">
            </div>
            <div>
              <label class="block text-[10px] md:text-xs font-medium mb-1.5" style="color: var(--text-muted)">
                手机号 <span style="color: var(--danger)">*</span>
              </label>
              <input v-model="phone" type="tel" class="form-input" placeholder="请输入手机号" maxlength="11">
            </div>
            <div>
              <label class="block text-[10px] md:text-xs font-medium mb-1.5" style="color: var(--text-muted)">备注（选填）</label>
              <textarea v-model="note" class="form-input" rows="2" placeholder="如有特殊需求请在此说明" />
            </div>
          </div>
        </template>

        <!-- Step 4: 确认 -->
        <template v-if="bookingState.step === 4">
          <p class="text-xs md:text-sm mb-3" style="color: var(--text-muted)">请确认以下预约信息</p>
          <div class="card p-4 md:p-5 space-y-3" style="background: var(--sel-bg)">
            <div class="flex items-center gap-3">
              <div v-if="selectedService" class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background: var(--svc-icon-bg); color: var(--accent)">
                <i :class="`fa-solid ${selectedService.icon}`" />
              </div>
              <div>
                <p class="font-bold text-sm">{{ selectedService?.name }}</p>
                <p class="text-[10px] md:text-xs" style="color: var(--text-muted)">
                  {{ selectedService?.duration }}分钟 · &yen;{{ selectedService?.price }}
                </p>
              </div>
            </div>
            <div class="divider-fancy text-[10px]">
              <i class="fa-solid fa-sparkles" style="color: var(--accent); font-size: 8px" />
            </div>
            <div class="grid grid-cols-2 gap-3 text-xs md:text-sm">
              <div>
                <p class="text-[10px] mb-0.5" style="color: var(--text-muted)">美甲师</p>
                <p class="font-medium">{{ selectedArtist?.name || '随机分配' }}</p>
              </div>
              <div>
                <p class="text-[10px] mb-0.5" style="color: var(--text-muted)">日期</p>
                <p class="font-medium">{{ bookingState.date ? formatDateDisplay(dateToString(bookingState.date)) : '' }}</p>
              </div>
              <div>
                <p class="text-[10px] mb-0.5" style="color: var(--text-muted)">时间</p>
                <p class="font-medium">{{ bookingState.time }}</p>
              </div>
              <div>
                <p class="text-[10px] mb-0.5" style="color: var(--text-muted)">联系方式</p>
                <p class="font-medium">{{ phone }}</p>
              </div>
            </div>
            <div v-if="note">
              <p class="text-[10px] mb-0.5" style="color: var(--text-muted)">备注</p>
              <p class="text-xs">{{ note }}</p>
            </div>
            <div class="pt-2" style="border-top: 1px solid var(--border)">
              <div class="flex items-center justify-between">
                <span class="text-xs" style="color: var(--text-muted)">预约费用</span>
                <span class="font-display text-xl md:text-2xl font-bold" style="color: var(--accent)">
                  &yen;{{ bookingFee }}
                </span>
              </div>
              <p class="text-[10px] mt-1" style="color: var(--text-muted)">
                预约时间{{ cancelHours }}小时内不可取消
              </p>
            </div>
          </div>
        </template>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between p-4 md:p-6 pt-3" style="border-top: 1px solid var(--border)">
        <button
          class="btn-outline btn-sm text-xs"
          :style="{ visibility: bookingState.step === 0 ? 'hidden' : 'visible' }"
          @click="handlePrev()"
        >
          <i class="fa-solid fa-arrow-left mr-1" />上一步
        </button>
        <button
          class="btn-primary btn-sm text-xs"
          :disabled="!canProceed"
          @click="handleNext()"
        >
          <template v-if="bookingState.step === 4">
            <i class="fa-solid fa-check mr-1" />确认预约
          </template>
          <template v-else>
            下一步<i class="fa-solid fa-arrow-right ml-1" />
          </template>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.schedule-dot {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #22c55e;
}
.dot-unavailable {
  background: #ef4444;
}
.cal-day {
  position: relative;
}
.cal-day.schedule-unavailable {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
