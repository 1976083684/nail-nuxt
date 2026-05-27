<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const artists = ref<any[]>([])
const selectedArtist = ref<number | null>(null)
const artistSearch = ref('')
const showArtistDropdown = ref(false)
const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth())
const loading = ref(false)
const saving = ref(false)

// 时间段配置
const timeSlots = ref<string[]>([])
const businessStart = ref('10:00')
const businessEnd = ref('19:00')

// 鼠标拖拽选择
const isDragging = ref(false)
const dragStartDate = ref<string | null>(null)
const dragEndDate = ref<string | null>(null)
const dragSelectedDates = ref<string[]>([])

// 当前选中的日期（用于编辑时段）
const editingDate = ref<string | null>(null)

// 临时排班设置（未确认前保存在本地）
const tempScheduleSettings = ref<Record<string, { isFullOff: boolean; reason: string; unavailableSlots: string[] }>>({})
// 双击计时器
const clickTimer = ref<ReturnType<typeof setTimeout> | null>(null)
// 时间段拖拽批量操作
const slotDragging = ref(false)
const slotDragTarget = ref<boolean | null>(null)

// 已有排班数据
const schedules = ref<any[]>([])

// 节假日数据
const holidaysData = ref<Record<string, { name: string; isWorkday: boolean }>>({})

// 选中日期的排班
const editingDateSchedules = computed(() => {
  if (!editingDate.value) return []
  return schedules.value.filter(s => {
    const d = typeof s.date === 'string' ? s.date.split('T')[0] : new Date(s.date).toISOString().split('T')[0]
    return d === editingDate.value
  })
})

const editingDateFullOff = computed(() => {
  return editingDateSchedules.value.some((s: any) => !s.time_slot)
})

const editingDateUnavailableSlots = computed(() => {
  const set = new Set<string>()
  for (const s of editingDateSchedules.value) {
    if (s.time_slot) set.add(s.time_slot)
  }
  return set
})

const editingDateFullReason = computed(() => {
  const full = editingDateSchedules.value.find((s: any) => !s.time_slot)
  return full?.reason || ''
})

// 判断时间段是否可预约（不在不可用列表中且不是整天休息）
function isSlotAvailable(slot: string): boolean {
  if (editingDateFullOff.value) return false
  return !editingDateUnavailableSlots.value.has(slot)
}

// 编辑日期的节假日信息
const editingDateHoliday = computed(() => {
  if (!editingDate.value) return null
  return holidaysData.value[editingDate.value] || null
})

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

// 美甲师搜索
const filteredArtists = computed(() => {
  if (!artistSearch.value) return artists.value
  const kw = artistSearch.value.toLowerCase()
  return artists.value.filter(a => a.name.toLowerCase().includes(kw))
})
const selectedArtistName = computed(() => {
  const a = artists.value.find(a => a.id === selectedArtist.value)
  return a?.name || ''
})

// 日历数据（翻页不清除选择）
const calendarDays = computed(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1).getDay()
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days: Array<{
    day: number | null
    dateStr: string | null
    isPast: boolean
    isToday: boolean
    isDragSelected: boolean
    isEditing: boolean
    isWeekend: boolean
    isHoliday: boolean
    isWorkday: boolean // 补班日
    holidayName: string
    hasSchedule: boolean
    isFullOff: boolean
  }> = []

  for (let i = 0; i < firstDay; i++) {
    days.push({ day: null, dateStr: null, isPast: false, isToday: false, isDragSelected: false, isEditing: false, isWeekend: false, isHoliday: false, isWorkday: false, holidayName: '', hasSchedule: false, isFullOff: false })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(viewYear.value, viewMonth.value, d)
    const dateStr = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const isPast = dt < today
    const isToday = dt.getTime() === today.getTime()
    const isDragSelected = dragSelectedDates.value.includes(dateStr)
    const isEditing = editingDate.value === dateStr
    const dayOfWeek = dt.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    // 节假日信息
    const holiday = holidaysData.value[dateStr]
    const isHoliday = !!holiday && !holiday.isWorkday
    const isWorkday = !!holiday && holiday.isWorkday // 补班日
    const holidayName = holiday?.name || ''

    const dayEntries = schedules.value.filter(s => {
      const sd = typeof s.date === 'string' ? s.date.split('T')[0] : new Date(s.date).toISOString().split('T')[0]
      return sd === dateStr
    })
    const hasSchedule = dayEntries.length > 0
    const isFullOff = dayEntries.some((s: any) => !s.time_slot)

    days.push({ day: d, dateStr, isPast, isToday, isDragSelected, isEditing, isWeekend, isHoliday, isWorkday, holidayName, hasSchedule, isFullOff })
  }

  return days
})

// 加载美甲师
async function loadArtists() {
  try {
    artists.value = await $fetch<any[]>('/api/admin/artists')
    if (artists.value.length > 0 && !selectedArtist.value) {
      selectedArtist.value = artists.value[0].id
      artistSearch.value = artists.value[0].name
    }
  } catch (e) {
    console.error('加载美甲师失败:', e)
  }
}

// 加载时间段
async function loadTimeSlots() {
  try {
    const settings = await $fetch<any[]>('/api/admin/settings')
    const startH = settings.find(s => s.setting_key === 'business_hours_start')?.setting_value || '10:00'
    const endH = settings.find(s => s.setting_key === 'business_hours_end')?.setting_value || '19:00'
    const duration = Number(settings.find(s => s.setting_key === 'slot_duration')?.setting_value) || 30

    businessStart.value = startH
    businessEnd.value = endH

    const slots: string[] = []
    const [sh, sm] = startH.split(':').map(Number)
    const [eh, em] = endH.split(':').map(Number)
    let minutes = sh * 60 + sm
    const endMinutes = eh * 60 + em
    while (minutes < endMinutes) {
      slots.push(`${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`)
      minutes += duration
    }
    timeSlots.value = slots
  } catch {
    timeSlots.value = []
    for (let h = 10; h < 19; h++) {
      timeSlots.value.push(`${String(h).padStart(2, '0')}:00`)
      timeSlots.value.push(`${String(h).padStart(2, '0')}:30`)
    }
    businessStart.value = '10:00'
    businessEnd.value = '19:00'
  }
}

// 加载排班数据
async function loadSchedules() {
  if (!selectedArtist.value) return
  loading.value = true
  try {
    const startDate = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2, '0')}-01`
    const endDate = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2, '0')}-${new Date(viewYear.value, viewMonth.value + 1, 0).getDate()}`
    schedules.value = await $fetch<any[]>('/api/admin/schedules', {
      query: { artistId: selectedArtist.value, startDate, endDate },
    })
  } catch (e) {
    console.error('加载排班失败:', e)
  }
  loading.value = false
}

// 加载节假日数据
async function loadHolidays() {
  try {
    const data = await $fetch<any>('/api/admin/holidays', {
      query: { year: viewYear.value },
    })
    if (data?.holidays) {
      holidaysData.value = data.holidays
    }
  } catch (e) {
    console.error('加载节假日失败:', e)
  }
}

// 选择美甲师
function selectArtist(artist: any) {
  selectedArtist.value = artist.id
  artistSearch.value = artist.name
  showArtistDropdown.value = false
  editingDate.value = null
  loadSchedules()
}

function onArtistSearchFocus() {
  showArtistDropdown.value = true
  artistSearch.value = ''
}

function onArtistSearchBlur() {
  setTimeout(() => {
    showArtistDropdown.value = false
    if (selectedArtist.value) artistSearch.value = selectedArtistName.value
  }, 200)
}

// 判断日期是否应该被排除（节假日或周末，但补班日不排除）
function shouldExcludeDate(dateStr: string): boolean {
  const holiday = holidaysData.value[dateStr]
  // 如果是补班日（调休工作日），不排除
  if (holiday?.isWorkday) return false
  // 如果是节假日，排除
  if (holiday && !holiday.isWorkday) return true
  // 如果是周末，排除
  const dt = new Date(dateStr + 'T00:00:00')
  const dayOfWeek = dt.getDay()
  if (dayOfWeek === 0 || dayOfWeek === 6) return true
  return false
}

// 鼠标拖拽
function onDateMouseDown(dateStr: string, isPast: boolean) {
  if (isPast) return
  isDragging.value = true
  dragStartDate.value = dateStr
  dragEndDate.value = dateStr
  updateDragSelection()
}

function onDateMouseEnter(dateStr: string, isPast: boolean) {
  if (!isDragging.value || isPast) return
  dragEndDate.value = dateStr
  updateDragSelection()
}

function onDateMouseUp() {
  if (!isDragging.value) return
  isDragging.value = false
}

function updateDragSelection() {
  if (!dragStartDate.value || !dragEndDate.value) {
    return
  }
  const start = dragStartDate.value < dragEndDate.value ? dragStartDate.value : dragEndDate.value
  const end = dragStartDate.value < dragEndDate.value ? dragEndDate.value : dragStartDate.value
  const dates: string[] = []
  const current = new Date(start + 'T00:00:00')
  const endDt = new Date(end + 'T00:00:00')
  while (current <= endDt) {
    const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`
    // 只添加新选中，不取消已选中的
    if (!dragSelectedDates.value.includes(dateStr)) {
      dates.push(dateStr)
    }
    current.setDate(current.getDate() + 1)
  }
  // 合并已有选中和新选中
  dragSelectedDates.value = [...new Set([...dragSelectedDates.value, ...dates])]
}

// 快速选择（自动排除节假日和周末，补班日除外）
function selectThisWeek() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayOfWeek = today.getDay()
  const start = new Date(today)
  start.setDate(today.getDate() - dayOfWeek)
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    if (d >= today) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      // 自动排除节假日和周末（补班日除外）
      if (!shouldExcludeDate(dateStr)) {
        dates.push(dateStr)
      }
    }
  }
  dragSelectedDates.value = dates
  if (dates.length > 0) {
    dragStartDate.value = dates[0]
    dragEndDate.value = dates[dates.length - 1]
  }
}

function selectNextWeek() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayOfWeek = today.getDay()
  const nextSunday = new Date(today)
  nextSunday.setDate(today.getDate() + (7 - dayOfWeek))
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(nextSunday)
    d.setDate(nextSunday.getDate() + i)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    // 自动排除节假日和周末（补班日除外）
    if (!shouldExcludeDate(dateStr)) {
      dates.push(dateStr)
    }
  }
  dragSelectedDates.value = dates
  if (dates.length > 0) {
    dragStartDate.value = dates[0]
    dragEndDate.value = dates[dates.length - 1]
  }
}

function selectThisMonth() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const dates: string[] = []
  for (let d = today.getDate(); d <= daysInMonth; d++) {
    const dt = new Date(viewYear.value, viewMonth.value, d)
    if (dt >= today) {
      const dateStr = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      // 自动排除节假日和周末（补班日除外）
      if (!shouldExcludeDate(dateStr)) {
        dates.push(dateStr)
      }
    }
  }
  dragSelectedDates.value = dates
  if (dates.length > 0) {
    dragStartDate.value = dates[0]
    dragEndDate.value = dates[dates.length - 1]
  }
}

function selectNextMonth() {
  let nextYear = viewYear.value
  let nextMonth = viewMonth.value + 1
  if (nextMonth > 11) { nextMonth = 0; nextYear++ }
  const daysInMonth = new Date(nextYear, nextMonth + 1, 0).getDate()
  const dates: string[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    if (!shouldExcludeDate(dateStr)) {
      dates.push(dateStr)
    }
  }
  dragSelectedDates.value = dates
  if (dates.length > 0) {
    dragStartDate.value = dates[0]
    dragEndDate.value = dates[dates.length - 1]
  }
}

// 时间段拖拽批量操作
function onSlotMouseDown(slot: string) {
  if (saving.value) return
  slotDragging.value = true
  // 目标状态：如果当前可用，则拖拽设为不可用；反之亦然
  slotDragTarget.value = !isSlotAvailable(slot)
  toggleTimeSlotDirect(slot, slotDragTarget.value)
}

function onSlotMouseEnter(slot: string) {
  if (!slotDragging.value || saving.value) return
  toggleTimeSlotDirect(slot, slotDragTarget.value!)
}

function onSlotMouseUp() {
  slotDragging.value = false
  slotDragTarget.value = null
}

async function toggleTimeSlotDirect(slot: string, makeUnavailable: boolean) {
  if (!editingDate.value || !selectedArtist.value) return
  const isCurrentlyAvailable = isSlotAvailable(slot)
  // 状态已经和目标一致，跳过
  if (makeUnavailable === !isCurrentlyAvailable) return

  saving.value = true
  try {
    // 如果有整天休息记录，先删除
    if (editingDateFullOff.value) {
      const fullDay = editingDateSchedules.value.find((s: any) => !s.time_slot)
      if (fullDay) await $fetch(`/api/admin/schedules/${fullDay.id}`, { method: 'DELETE' })
    }

    if (makeUnavailable) {
      await $fetch('/api/admin/schedules', {
        method: 'POST',
        body: { artistId: selectedArtist.value, date: editingDate.value, timeSlot: slot, reason: '' },
      })
    } else {
      const entry = editingDateSchedules.value.find((s: any) => s.time_slot === slot)
      if (entry) await $fetch(`/api/admin/schedules/${entry.id}`, { method: 'DELETE' })
    }
    await loadSchedules()
  } catch { alert('操作失败') }
  saving.value = false
}

function clearSelection() {
  resetAllStates()
}

// 确认排班（批量设置为全天上班）
async function confirmBatchWork() {
  if (!selectedArtist.value || dragSelectedDates.value.length === 0) return
  saving.value = true
  try {
    await $fetch('/api/admin/schedules/batch', {
      method: 'POST',
      body: {
        artistId: selectedArtist.value,
        dates: dragSelectedDates.value,
        type: 'work',
      },
    })
    // 确认后重置所有状态
    resetAllStates()
    await loadSchedules()
  } catch (e: any) {
    alert(e?.data?.message || '操作失败')
  }
  saving.value = false
}

// 重置所有状态
function resetAllStates() {
  dragSelectedDates.value = []
  dragStartDate.value = null
  dragEndDate.value = null
  editingDate.value = null
  tempScheduleSettings.value = {}
  isDragging.value = false
}

// 单击日期 - 查看详情
function clickDate(dateStr: string, isPast: boolean) {
  if (isPast) return
  // 单击只切换编辑日期查看详情，不影响选中状态
  editingDate.value = dateStr
}

// 双击日期 - 取消该日期的选中状态
function dblClickDate(dateStr: string, isPast: boolean) {
  if (isPast) return
  // 取消该日期的选中
  dragSelectedDates.value = dragSelectedDates.value.filter(d => d !== dateStr)
  // 如果取消的是当前编辑日期，清空编辑状态
  if (editingDate.value === dateStr) {
    editingDate.value = null
  }
}

// 处理点击事件（区分单击和双击）
function handleDateClick(dateStr: string, isPast: boolean, event: MouseEvent) {
  if (isPast) return
  event.preventDefault()

  if (clickTimer.value) {
    // 双击
    clearTimeout(clickTimer.value)
    clickTimer.value = null
    dblClickDate(dateStr, isPast)
  } else {
    // 单击（延迟执行，等待可能的双击）
    clickTimer.value = setTimeout(() => {
      clickTimer.value = null
      clickDate(dateStr, isPast)
    }, 250)
  }
}

// 切换时间段
async function toggleTimeSlot(slot: string) {
  if (!editingDate.value || !selectedArtist.value) return
  saving.value = true
  try {
    // 如果有整天休息记录，先删除
    if (editingDateFullOff.value) {
      const fullDay = editingDateSchedules.value.find((s: any) => !s.time_slot)
      if (fullDay) await $fetch(`/api/admin/schedules/${fullDay.id}`, { method: 'DELETE' })
    }

    if (editingDateUnavailableSlots.value.has(slot)) {
      const entry = editingDateSchedules.value.find((s: any) => s.time_slot === slot)
      if (entry) await $fetch(`/api/admin/schedules/${entry.id}`, { method: 'DELETE' })
    } else {
      await $fetch('/api/admin/schedules', {
        method: 'POST',
        body: { artistId: selectedArtist.value, date: editingDate.value, timeSlot: slot, reason: '' },
      })
    }
    await loadSchedules()
  } catch { alert('操作失败') }
  saving.value = false
}

// 更新时间段原因
async function updateSlotReason(slot: string, reason: string) {
  if (!editingDate.value || !selectedArtist.value) return
  await $fetch('/api/admin/schedules', {
    method: 'POST',
    body: { artistId: selectedArtist.value, date: editingDate.value, timeSlot: slot, reason },
  })
  await loadSchedules()
}

function changeMonth(delta: number) {
  viewMonth.value += delta
  if (viewMonth.value > 11) { viewMonth.value = 0; viewYear.value++ }
  if (viewMonth.value < 0) { viewMonth.value = 11; viewYear.value-- }
  // 翻页不清除选择，只切换编辑日期
  editingDate.value = null
  loadSchedules()
  // 如果年份变了，重新加载节假日
  if (delta > 12 || delta < -12) {
    loadHolidays()
  }
}

function formatDateDisplay(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const w = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getMonth() + 1}月${d.getDate()}日 ${w[d.getDay()]}`
}

function handleGlobalClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.artist-dropdown-wrapper')) {
    showArtistDropdown.value = false
    if (selectedArtist.value) artistSearch.value = selectedArtistName.value
  }
}

function handleGlobalMouseUp() {
  if (isDragging.value) onDateMouseUp()
  if (slotDragging.value) onSlotMouseUp()
}

onMounted(async () => {
  document.addEventListener('mouseup', handleGlobalMouseUp)
  document.addEventListener('click', handleGlobalClick)
  await Promise.all([loadArtists(), loadTimeSlots(), loadHolidays()])
  await loadSchedules()
})

onUnmounted(() => {
  document.removeEventListener('mouseup', handleGlobalMouseUp)
  document.removeEventListener('click', handleGlobalClick)
  if (clickTimer.value) {
    clearTimeout(clickTimer.value)
  }
})

watch(selectedArtist, () => {
  editingDate.value = null
  loadSchedules()
})

// 监听年份变化，重新加载节假日
watch(viewYear, () => {
  loadHolidays()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">
        <i class="fas fa-plus-circle text-pink-500 mr-2" />新增排班
      </h2>
      <NuxtLink
        to="/admin/schedules"
        class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
      >
        <i class="fas fa-arrow-left mr-1" />返回总览
      </NuxtLink>
    </div>

    <!-- 美甲师选择 + 快捷按钮 -->
    <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700">美甲师：</label>
          <div class="relative artist-dropdown-wrapper min-w-[180px]">
            <div class="relative">
              <input
                v-model="artistSearch"
                type="text"
                class="w-full px-3 py-2 pr-8 border rounded-lg text-sm focus:border-pink-400 outline-none"
                placeholder="搜索..."
                @focus="onArtistSearchFocus"
                @input="showArtistDropdown = true"
              />
              <i class="fas fa-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
            </div>
            <div
              v-if="showArtistDropdown && filteredArtists.length > 0"
              class="absolute z-20 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-[200px] overflow-y-auto"
            >
              <div
                v-for="a in filteredArtists"
                :key="a.id"
                :class="[
                  'px-3 py-2 text-sm cursor-pointer hover:bg-pink-50 transition-colors',
                  selectedArtist === a.id ? 'bg-pink-50 text-pink-600 font-medium' : 'text-gray-700',
                ]"
                @mousedown.prevent="selectArtist(a)"
              >
                {{ a.name }}
              </div>
            </div>
          </div>
        </div>

        <div class="h-6 w-px bg-gray-200" />

        <div class="flex gap-2">
          <button class="px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600" @click="selectThisWeek">
            <i class="fas fa-calendar-week mr-1" />排本周
          </button>
          <button class="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600" @click="selectNextWeek">
            <i class="fas fa-calendar-week mr-1" />排下周
          </button>
          <button class="px-3 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600" @click="selectThisMonth">
            <i class="fas fa-calendar mr-1" />排本月
          </button>
          <button class="px-3 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600" @click="selectNextMonth">
            <i class="fas fa-calendar-plus mr-1" />排下月
          </button>
        </div>

        <template v-if="dragSelectedDates.length > 0">
          <div class="h-6 w-px bg-gray-200" />
          <span class="text-sm text-blue-600">
            <i class="fas fa-info-circle mr-1" />已选 {{ dragSelectedDates.length }} 天
          </span>
          <button class="px-3 py-2 bg-pink-500 text-white rounded-lg text-sm hover:bg-pink-600 disabled:opacity-50" :disabled="saving" @click="confirmBatchWork">
            <i v-if="saving" class="fas fa-spinner fa-spin mr-1" />
            <i v-else class="fas fa-check mr-1" />确认排班
          </button>
          <button class="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200" @click="clearSelection">
            <i class="fas fa-times mr-1" />清除
          </button>
        </template>
      </div>
      <div class="mt-2 text-xs text-gray-500">
        <i class="fas fa-info-circle mr-1" />
        快捷排班自动排除节假日和周末（国家补班日除外），营业时间：{{ businessStart }} - {{ businessEnd }}
      </div>
    </div>

    <div v-if="loading" class="text-center py-20">
      <i class="fas fa-spinner fa-spin text-pink-500 text-3xl" />
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- 日历 -->
      <div class="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <!-- 月份导航 -->
        <div class="flex items-center justify-between mb-4">
          <button class="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100" @click="changeMonth(-1)">
            <i class="fas fa-chevron-left text-gray-500 text-sm" />
          </button>
          <div class="flex items-center gap-2">
            <span class="font-bold text-gray-800">{{ viewYear }}年{{ viewMonth + 1 }}月</span>
            <button
              v-if="dragSelectedDates.length > 0"
              class="text-xs text-pink-500 hover:text-pink-600"
              @click="clearSelection"
            >
              (清除选中)
            </button>
          </div>
          <button class="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100" @click="changeMonth(1)">
            <i class="fas fa-chevron-right text-gray-500 text-sm" />
          </button>
        </div>

        <!-- 星期头部 -->
        <div class="grid grid-cols-7 gap-1 text-center mb-2">
          <span v-for="d in weekDays" :key="d" class="text-xs font-medium text-gray-500 py-1">{{ d }}</span>
        </div>

        <!-- 日期网格 -->
        <div class="grid grid-cols-7 gap-1 select-none">
          <div
            v-for="(cell, i) in calendarDays"
            :key="i"
            :class="[
              'relative p-2 min-h-[70px] rounded-lg text-sm transition-all border',
              cell.day === null ? 'border-transparent' : 'border-gray-200',
              cell.isPast && cell.day ? 'bg-gray-50 cursor-default' : '',
              !cell.isPast && cell.day ? 'cursor-pointer' : '',
              cell.isEditing ? 'border-blue-400 bg-blue-300' : '',
              !cell.isEditing && cell.isDragSelected ? 'border-blue-300 bg-blue-100' : '',
              cell.isHoliday && !cell.isPast && !cell.isEditing && !cell.isDragSelected ? 'bg-amber-50' : '',
              cell.isWorkday && !cell.isPast && !cell.isEditing && !cell.isDragSelected ? 'bg-green-50/70' : '',
              cell.isWeekend && !cell.isPast && !cell.isEditing && !cell.isDragSelected && !cell.isHoliday && !cell.isWorkday ? 'bg-amber-50/50' : '',
            ]"
            @click="cell.day && cell.dateStr && handleDateClick(cell.dateStr, cell.isPast, $event)"
            @dblclick="cell.day && cell.dateStr && dblClickDate(cell.dateStr, cell.isPast)"
            @mousedown="cell.day && !cell.isPast && cell.dateStr && onDateMouseDown(cell.dateStr, cell.isPast)"
            @mouseenter="cell.day && !cell.isPast && cell.dateStr && onDateMouseEnter(cell.dateStr, cell.isPast)"
          >
            <div class="flex items-center justify-between">
              <span
                v-if="cell.day"
                :class="[
                  'font-medium',
                  cell.isPast ? 'text-gray-400' : 'text-gray-700',
                  cell.isToday ? 'text-pink-500' : '',
                  cell.isHoliday && !cell.isPast ? 'text-amber-600' : '',
                  cell.isWorkday && !cell.isPast ? 'text-green-600' : '',
                  cell.isWeekend && !cell.isPast && !cell.isHoliday && !cell.isWorkday ? 'text-amber-600' : '',
                ]"
              >
                {{ cell.day }}
              </span>
              <div class="flex items-center gap-0.5">
                <span v-if="cell.isHoliday && cell.day && !cell.isPast" class="text-[9px] text-amber-600" :title="cell.holidayName">
                  假
                </span>
                <span v-else-if="cell.isWorkday && cell.day && !cell.isPast" class="text-[9px] text-green-600" title="补班日">
                  班
                </span>
                <span v-else-if="cell.isWeekend && cell.day && !cell.isPast" class="text-[9px] text-amber-500">
                  休
                </span>
              </div>
            </div>
            <!-- 节假日名称 -->
            <div v-if="cell.holidayName && cell.day && !cell.isPast" class="text-[10px] text-amber-500 truncate mt-0.5">
              {{ cell.holidayName }}
            </div>
            <!-- 状态点 -->
            <div v-if="cell.day && !cell.isPast" class="absolute bottom-1 left-1/2 -translate-x-1/2">
              <div
                v-if="cell.isFullOff"
                class="w-2 h-2 rounded-full bg-red-400"
                title="整天休息"
              />
              <div
                v-else-if="cell.hasSchedule"
                class="w-2 h-2 rounded-full bg-green-400"
                title="已排班"
              />
            </div>
          </div>
        </div>

        <!-- 图例 -->
        <div class="flex flex-wrap items-center gap-4 mt-4 text-xs text-gray-500">
          <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full bg-green-400" />已排班</div>
          <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full bg-blue-400 border border-blue-500" />选中</div>
          <div class="flex items-center gap-1"><span class="text-amber-600 text-[10px]">假</span>节假日</div>
          <div class="flex items-center gap-1"><span class="text-green-600 text-[10px]">班</span>补班日</div>
          <div class="flex items-center gap-1"><span class="text-amber-600 text-[10px]">休</span>周末</div>
        </div>
      </div>

      <!-- 右侧编辑面板 -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <template v-if="editingDate">
          <h3 class="font-bold text-gray-800 mb-2">
            <i class="fas fa-edit text-pink-500 mr-2" />{{ formatDateDisplay(editingDate) }}
          </h3>

          <!-- 节假日/补班日信息 -->
          <div v-if="editingDateHoliday" class="mb-3 px-3 py-2 rounded-lg text-xs" :class="editingDateHoliday.isWorkday ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'">
            <i :class="editingDateHoliday.isWorkday ? 'fas fa-briefcase' : 'fas fa-umbrella-beach'" class="mr-1" />
            {{ editingDateHoliday.name }}{{ editingDateHoliday.isWorkday ? '（补班日，正常排班）' : '（节假日）' }}
          </div>

          <!-- 营业时间提示 -->
          <div class="mb-3 px-3 py-2 bg-blue-50 rounded-lg text-xs text-blue-700">
            <i class="fas fa-clock mr-1" />
            默认排班时间：{{ businessStart }} - {{ businessEnd }}
          </div>

          <!-- 时间段 -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm font-medium text-gray-700">排班时间段：</p>
              <span class="text-[10px] text-gray-400">鼠标滑动可批量操作</span>
            </div>
            <div class="space-y-1 max-h-[300px] overflow-y-auto select-none">
              <div
                v-for="slot in timeSlots"
                :key="slot"
                :class="['flex items-center gap-2 p-2 rounded-lg text-sm transition-colors cursor-pointer', isSlotAvailable(slot) ? 'bg-green-50' : 'bg-red-50']"
                @mousedown.prevent="onSlotMouseDown(slot)"
                @mouseenter="onSlotMouseEnter(slot)"
                @mouseup="onSlotMouseUp"
              >
                <div
                  :class="[
                    'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                    isSlotAvailable(slot) ? 'bg-green-500 border-green-500 text-white' : 'bg-red-500 border-red-500 text-white',
                  ]"
                >
                  <i v-if="isSlotAvailable(slot)" class="fas fa-check text-[10px]" />
                  <i v-else class="fas fa-times text-[10px]" />
                </div>
                <span class="font-mono text-gray-700 min-w-[45px]">{{ slot }}</span>
                <span :class="['text-xs', isSlotAvailable(slot) ? 'text-green-600' : 'text-red-600']">
                  {{ isSlotAvailable(slot) ? '可预约' : '不可用' }}
                </span>
              </div>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="text-center py-10 text-gray-400">
            <i class="fas fa-hand-pointer text-4xl mb-3" />
            <p class="text-sm">点击日期查看排班详情</p>
            <p class="text-xs mt-1">勾选/取消时间段控制可预约状态</p>
            <div class="mt-4 text-xs text-left text-gray-500 space-y-1">
              <p><i class="fas fa-info-circle text-blue-400 mr-1" />单击日期：查看详情</p>
              <p><i class="fas fa-info-circle text-purple-400 mr-1" />双击日期：取消选中</p>
              <p><i class="fas fa-info-circle text-blue-400 mr-1" />鼠标拖拽：批量选择日期</p>
              <p><i class="fas fa-info-circle text-blue-400 mr-1" />快捷按钮：排本周/下周/本月</p>
              <p><i class="fas fa-info-circle text-green-400 mr-1" />确认排班后保存并重置</p>
              <p><i class="fas fa-info-circle text-blue-400 mr-1" />默认营业时间：{{ businessStart }} - {{ businessEnd }}</p>
              <p><i class="fas fa-info-circle text-red-400 mr-1" />节假日自动排除，补班日除外</p>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
