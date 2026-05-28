<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const artists = ref<any[]>([])
const schedules = ref<any[]>([])
const totalSlots = ref(0)
const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth())
const loading = ref(false)

// 悬停气泡
const hoverDate = ref<string | null>(null)
const hoverX = ref(0)
const hoverY = ref(0)

// 点击选中日期详情
const selectedDate = ref<string | null>(null)
const selectedArtistId = ref<number | null>(null)

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

// 日历数据
const calendarDays = computed(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1).getDay()
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days: Array<{
    day: number | null
    dateStr: string | null
    isToday: boolean
    isSelected: boolean
    artists: Array<{ id: number; name: string; hasFullOff: boolean; isFull: boolean; isPartial: boolean }>
  }> = []

  for (let i = 0; i < firstDay; i++) {
    days.push({ day: null, dateStr: null, isToday: false, isSelected: false, artists: [] })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(viewYear.value, viewMonth.value, d)
    const dateStr = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const isToday = dt.getTime() === today.getTime()
    const isSelected = selectedDate.value === dateStr

    // 当天排班的美甲师
    const dayEntries = schedules.value.filter(s => {
      const sd = String(s.date).substring(0, 10)
      return sd === dateStr
    })

    const artistMap = new Map<number, { name: string; hasFullOff: boolean; slotCount: number; unavailableCount: number }>()
    for (const entry of dayEntries) {
      const aid = entry.artist_id
      if (!artistMap.has(aid)) {
        artistMap.set(aid, { name: entry.artist_name || `美甲师${aid}`, hasFullOff: false, slotCount: 0, unavailableCount: 0 })
      }
      const info = artistMap.get(aid)!
      if (!entry.time_slot) info.hasFullOff = true
      else {
        info.slotCount++
        if (entry.is_unavailable) info.unavailableCount++
      }
    }
    const artistList = Array.from(artistMap.entries()).map(([id, info]) => {
      const isFull = !info.hasFullOff && info.slotCount > 0 && info.unavailableCount === 0
      const isPartial = !info.hasFullOff && info.slotCount > 0 && !isFull
      return { id, name: info.name, hasFullOff: info.hasFullOff, isFull, isPartial }
    })

    days.push({ day: d, dateStr, isToday, isSelected, artists: artistList })
  }

  return days
})

// 选中日期的排班详情
const selectedDateSchedules = computed(() => {
  if (!selectedDate.value) return []
  return schedules.value.filter(s => {
    const d = String(s.date).substring(0, 10)
    return d === selectedDate.value
  }).sort((a, b) => {
    if (!a.time_slot && b.time_slot) return -1
    if (a.time_slot && !b.time_slot) return 1
    return (a.time_slot || '').localeCompare(b.time_slot || '')
  })
})

// 按美甲师分组的详情
const selectedDateByArtist = computed(() => {
  const map = new Map<number, { name: string; entries: any[] }>()
  for (const s of selectedDateSchedules.value) {
    const aid = s.artist_id
    if (!map.has(aid)) {
      map.set(aid, { name: s.artist_name || `美甲师${aid}`, entries: [] })
    }
    map.get(aid)!.entries.push(s)
  }
  return Array.from(map.entries()).map(([id, info]) => ({ id, ...info }))
})

async function loadData() {
  loading.value = true
  try {
    const startDate = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2, '0')}-01`
    const endDate = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2, '0')}-${new Date(viewYear.value, viewMonth.value + 1, 0).getDate()}`
    const [a, s, settings] = await Promise.all([
      $fetch<any[]>('/api/admin/artists'),
      $fetch<any[]>('/api/admin/schedules', { query: { startDate, endDate } }),
      $fetch<any[]>('/api/admin/settings'),
    ])
    artists.value = a
    schedules.value = s

    // 计算总时间段数
    const startH = settings.find((s: any) => s.setting_key === 'business_hours_start')?.setting_value || '10:00'
    const endH = settings.find((s: any) => s.setting_key === 'business_hours_end')?.setting_value || '19:00'
    const duration = Number(settings.find((s: any) => s.setting_key === 'slot_duration')?.setting_value) || 30
    const [sh, sm] = startH.split(':').map(Number)
    const [eh, em] = endH.split(':').map(Number)
    let count = 0
    let minutes = sh * 60 + sm
    const endMinutes = eh * 60 + em
    while (minutes < endMinutes) {
      count++
      minutes += duration
    }
    totalSlots.value = count
  } catch (e) {
    console.error('加载数据失败:', e)
  }
  loading.value = false
}

function changeMonth(delta: number) {
  viewMonth.value += delta
  if (viewMonth.value > 11) { viewMonth.value = 0; viewYear.value++ }
  if (viewMonth.value < 0) { viewMonth.value = 11; viewYear.value-- }
  selectedDate.value = null
  selectedArtistId.value = null
  hoverDate.value = null
  loadData()
}

function onCellMouseEnter(e: MouseEvent, dateStr: string | null) {
  if (!dateStr) return
  hoverDate.value = dateStr
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  hoverX.value = rect.left + rect.width / 2
  hoverY.value = rect.top - 8
}

function onCellMouseLeave() {
  hoverDate.value = null
}

function selectDate(dateStr: string) {
  if (selectedDate.value === dateStr) {
    selectedDate.value = null
    selectedArtistId.value = null
    return
  }
  selectedDate.value = dateStr
  // 自动选中第一个有排班的美甲师
  nextTick(() => {
    selectedArtistId.value = selectedDateByArtist.value.length > 0
      ? selectedDateByArtist.value[0].id
      : null
  })
}

function formatDateDisplay(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const w = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getMonth() + 1}月${d.getDate()}日 ${w[d.getDay()]}`
}

// 悬停气泡数据
const hoverArtists = computed(() => {
  if (!hoverDate.value) return []
  const entries = schedules.value.filter(s => {
    const d = String(s.date).substring(0, 10)
    return d === hoverDate.value
  })
  const map = new Map<number, { name: string; hasFullOff: boolean; slotCount: number; unavailableCount: number }>()
  for (const e of entries) {
    if (!map.has(e.artist_id)) {
      map.set(e.artist_id, { name: e.artist_name || `美甲师${e.artist_id}`, hasFullOff: false, slotCount: 0, unavailableCount: 0 })
    }
    const info = map.get(e.artist_id)!
    if (!e.time_slot) info.hasFullOff = true
    else {
      info.slotCount++
      if (e.is_unavailable) info.unavailableCount++
    }
  }
  return Array.from(map.entries()).map(([id, info]) => {
    const isFull = !info.hasFullOff && info.slotCount > 0 && info.unavailableCount === 0
    const isPartial = !info.hasFullOff && info.slotCount > 0 && !isFull
    return { id, name: info.name, hasFullOff: info.hasFullOff, isFull, isPartial }
  })
})

onMounted(loadData)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">
        <i class="fas fa-calendar-alt text-blue-500 mr-2" />排班总览
      </h2>
      <div class="flex gap-2">
        <NuxtLink
          to="/admin/schedules/create"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
        >
          <i class="fas fa-plus mr-1" />新增排班
        </NuxtLink>
        <NuxtLink
          to="/admin/schedules/records"
          class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
        >
          <i class="fas fa-list mr-1" />排班记录
        </NuxtLink>
      </div>
    </div>

    <div v-if="loading" class="text-center py-20">
      <i class="fas fa-spinner fa-spin text-blue-500 text-3xl" />
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- 日历 -->
      <div class="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <!-- 月份导航 -->
        <div class="flex items-center justify-between mb-4">
          <button class="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100" @click="changeMonth(-1)">
            <i class="fas fa-chevron-left text-gray-500 text-sm" />
          </button>
          <span class="font-bold text-gray-800">{{ viewYear }}年{{ viewMonth + 1 }}月</span>
          <button class="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100" @click="changeMonth(1)">
            <i class="fas fa-chevron-right text-gray-500 text-sm" />
          </button>
        </div>

        <!-- 星期头部 -->
        <div class="grid grid-cols-7 gap-1 text-center mb-2">
          <span v-for="d in weekDays" :key="d" class="text-xs font-medium text-gray-500 py-1">{{ d }}</span>
        </div>

        <!-- 日期网格 -->
        <div class="grid grid-cols-7 gap-1">
          <div
            v-for="(cell, i) in calendarDays"
            :key="i"
            :class="[
              'relative p-2 min-h-[80px] rounded-lg text-sm transition-all border-2',
              cell.day === null ? 'border-transparent' : 'border-gray-100 hover:border-blue-300 cursor-pointer',
              cell.isToday ? 'ring-1 ring-blue-300' : '',
              cell.isSelected ? 'border-blue-500 bg-blue-50' : '',
            ]"
            @click="cell.day && cell.dateStr && selectDate(cell.dateStr)"
            @mouseenter="cell.day && cell.dateStr && onCellMouseEnter($event, cell.dateStr)"
            @mouseleave="onCellMouseLeave"
          >
            <span
              v-if="cell.day"
              :class="['font-medium', cell.isToday ? 'text-blue-500' : 'text-gray-700']"
            >
              {{ cell.day }}
            </span>
            <!-- 美甲师指示（单点+名字） -->
            <div v-if="cell.artists.length > 0" class="mt-1">
              <div class="flex items-center gap-1">
                <div
                  :class="[
                    'w-2 h-2 rounded-full flex-shrink-0',
                    cell.artists.some(a => a.hasFullOff) ? 'bg-red-400' :
                    cell.artists.some(a => a.isPartial) ? 'bg-yellow-400' : 'bg-green-400',
                  ]"
                />
                <span
                  class="text-[10px] truncate"
                  :class="cell.artists.some(a => a.hasFullOff) ? 'text-red-500' : cell.artists.some(a => a.isPartial) ? 'text-yellow-600' : 'text-gray-500'"
                >
                  {{ cell.artists[0].name }}<span v-if="cell.artists.length > 1" class="text-gray-400">...</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 图例 -->
        <div class="flex items-center gap-4 mt-4 text-xs text-gray-500">
          <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full bg-green-400" />已排满</div>
          <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full bg-yellow-400" />未排满</div>
          <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full bg-red-400" />整天休息</div>
        </div>
      </div>

      <!-- 右侧详情面板 -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <template v-if="selectedDate">
          <h3 class="font-bold text-gray-800 mb-4">
            <i class="fas fa-users text-blue-500 mr-2" />{{ formatDateDisplay(selectedDate) }} 排班详情
          </h3>

          <div v-if="selectedDateByArtist.length === 0" class="text-center py-8 text-gray-400 text-sm">
            当日暂无排班记录
          </div>

          <template v-else>
            <!-- 美甲师按钮横向滚动 -->
            <div class="mb-4 overflow-x-auto pb-2" :class="{ 'max-w-full': selectedDateByArtist.length > 5 }">
              <div class="flex gap-2" :style="selectedDateByArtist.length > 5 ? 'min-width: max-content' : ''">
                <button
                  v-for="artist in selectedDateByArtist"
                  :key="artist.id"
                  :class="[
                    'px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors',
                    selectedArtistId === artist.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                  ]"
                  @click="selectedArtistId = selectedArtistId === artist.id ? null : artist.id"
                >
                  {{ artist.name }}
                </button>
              </div>
            </div>

            <!-- 选中美甲师的详情 -->
            <div v-if="selectedArtistId" class="space-y-2">
              <div
                v-for="entry in (selectedDateByArtist.find(a => a.id === selectedArtistId)?.entries || [])"
                :key="entry.id"
                class="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded-lg"
              >
                <span
                  v-if="!entry.time_slot"
                  class="px-2 py-1 bg-red-100 text-red-600 rounded text-xs"
                >
                  整天休息
                </span>
                <span
                  v-else-if="entry.is_unavailable"
                  class="px-2 py-1 bg-yellow-100 text-yellow-600 rounded font-mono text-xs"
                >
                  {{ entry.time_slot }} 不可预约
                </span>
                <span
                  v-else
                  class="px-2 py-1 bg-green-100 text-green-600 rounded font-mono text-xs"
                >
                  {{ entry.time_slot }} 可预约
                </span>
                <span v-if="entry.reason" class="text-gray-400 text-xs">{{ entry.reason }}</span>
              </div>
            </div>

            <!-- 未选中时的提示 -->
            <div v-else class="text-center py-4 text-gray-400 text-sm">
              点击上方美甲师按钮查看详情
            </div>
          </template>
        </template>

        <template v-else>
          <div class="text-center py-10 text-gray-400">
            <i class="fas fa-calendar-day text-4xl mb-3" />
            <p class="text-sm">点击日期查看排班详情</p>
            <p class="text-xs mt-1">悬停可快速预览</p>
          </div>
        </template>
      </div>
    </div>

    <!-- 悬停气泡（Teleport 到 body 以避免裁剪） -->
    <Teleport to="body">
      <div
        v-if="hoverDate && hoverArtists.length > 0"
        class="fixed z-[9999] pointer-events-none"
        :style="{ left: hoverX + 'px', top: hoverY + 'px', transform: 'translate(-50%, -100%)' }"
      >
        <div class="bg-gray-900 text-white rounded-lg px-3 py-2 shadow-xl text-xs whitespace-nowrap max-w-[220px]">
          <div class="font-medium mb-1 border-b border-gray-700 pb-1">
            {{ hoverDate }}
          </div>
          <div class="space-y-1">
            <div v-for="a in hoverArtists" :key="a.id" class="flex items-center gap-2">
              <span
                :class="[
                  'w-2 h-2 rounded-full flex-shrink-0',
                  a.hasFullOff ? 'bg-red-400' : a.isPartial ? 'bg-yellow-400' : 'bg-green-400',
                ]"
              />
              <span>{{ a.name }}</span>
              <span v-if="a.hasFullOff" class="text-red-300">(休息)</span>
              <span v-else-if="a.isPartial" class="text-yellow-300">(未排满)</span>
            </div>
          </div>
          <div class="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-transparent border-t-gray-900" />
        </div>
      </div>
    </Teleport>
  </div>
</template>
