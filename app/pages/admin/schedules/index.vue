<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const artists = ref<any[]>([])
const schedules = ref<any[]>([])
const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth())
const loading = ref(false)

// 悬停气泡
const hoverDate = ref<string | null>(null)
const hoverX = ref(0)
const hoverY = ref(0)

// 点击选中日期详情
const selectedDate = ref<string | null>(null)

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
    artists: Array<{ id: number; name: string; hasFullOff: boolean; hasPartialOff: boolean }>
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
      const sd = typeof s.date === 'string' ? s.date.split('T')[0] : new Date(s.date).toISOString().split('T')[0]
      return sd === dateStr
    })

    const artistMap = new Map<number, { name: string; hasFullOff: boolean; hasPartialOff: boolean }>()
    for (const entry of dayEntries) {
      const aid = entry.artist_id
      if (!artistMap.has(aid)) {
        artistMap.set(aid, { name: entry.artist_name || `美甲师${aid}`, hasFullOff: false, hasPartialOff: false })
      }
      const info = artistMap.get(aid)!
      if (!entry.time_slot) info.hasFullOff = true
      else info.hasPartialOff = true
    }
    const artistList = Array.from(artistMap.entries()).map(([id, info]) => ({ id, ...info }))

    days.push({ day: d, dateStr, isToday, isSelected, artists: artistList })
  }

  return days
})

// 选中日期的排班详情
const selectedDateSchedules = computed(() => {
  if (!selectedDate.value) return []
  return schedules.value.filter(s => {
    const d = typeof s.date === 'string' ? s.date.split('T')[0] : new Date(s.date).toISOString().split('T')[0]
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
    const [a, s] = await Promise.all([
      $fetch<any[]>('/api/admin/artists'),
      $fetch<any[]>('/api/admin/schedules', { query: { startDate, endDate } }),
    ])
    artists.value = a
    schedules.value = s
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
  selectedDate.value = selectedDate.value === dateStr ? null : dateStr
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
    const d = typeof s.date === 'string' ? s.date.split('T')[0] : new Date(s.date).toISOString().split('T')[0]
    return d === hoverDate.value
  })
  const map = new Map<number, { name: string; hasFullOff: boolean; hasPartialOff: boolean }>()
  for (const e of entries) {
    if (!map.has(e.artist_id)) {
      map.set(e.artist_id, { name: e.artist_name || `美甲师${e.artist_id}`, hasFullOff: false, hasPartialOff: false })
    }
    const info = map.get(e.artist_id)!
    if (!e.time_slot) info.hasFullOff = true
    else info.hasPartialOff = true
  }
  return Array.from(map.entries()).map(([id, info]) => ({ id, ...info }))
})

onMounted(loadData)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">
        <i class="fas fa-calendar-alt text-pink-500 mr-2" />排班总览
      </h2>
      <div class="flex gap-2">
        <NuxtLink
          to="/admin/schedules/create"
          class="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm hover:bg-pink-600"
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
              cell.day === null ? 'border-transparent' : 'border-gray-100 hover:border-pink-300 cursor-pointer',
              cell.isToday ? 'ring-1 ring-pink-300' : '',
              cell.isSelected ? 'border-pink-500 bg-pink-50' : '',
            ]"
            @click="cell.day && cell.dateStr && selectDate(cell.dateStr)"
            @mouseenter="cell.day && cell.dateStr && onCellMouseEnter($event, cell.dateStr)"
            @mouseleave="onCellMouseLeave"
          >
            <span
              v-if="cell.day"
              :class="['font-medium', cell.isToday ? 'text-pink-500' : 'text-gray-700']"
            >
              {{ cell.day }}
            </span>
            <!-- 美甲师指示点 -->
            <div v-if="cell.artists.length > 0" class="flex flex-wrap gap-1 mt-1">
              <div
                v-for="a in cell.artists.slice(0, 4)"
                :key="a.id"
                :class="[
                  'w-2 h-2 rounded-full',
                  a.hasFullOff ? 'bg-red-400' : a.hasPartialOff ? 'bg-orange-400' : 'bg-green-400',
                ]"
                :title="a.name"
              />
              <span v-if="cell.artists.length > 4" class="text-[10px] text-gray-400">+{{ cell.artists.length - 4 }}</span>
            </div>
            <!-- 美甲师名字（简略） -->
            <div v-if="cell.artists.length > 0" class="mt-0.5 space-y-0.5">
              <div
                v-for="a in cell.artists.slice(0, 2)"
                :key="a.id"
                class="text-[10px] truncate"
                :class="a.hasFullOff ? 'text-red-500' : 'text-gray-500'"
              >
                {{ a.name }}
              </div>
              <div v-if="cell.artists.length > 2" class="text-[10px] text-gray-400">
                +{{ cell.artists.length - 2 }}人
              </div>
            </div>
          </div>
        </div>

        <!-- 图例 -->
        <div class="flex items-center gap-4 mt-4 text-xs text-gray-500">
          <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full bg-green-400" />全天排班</div>
          <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full bg-orange-400" />部分时段</div>
          <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full bg-red-400" />整天休息</div>
        </div>
      </div>

      <!-- 右侧详情面板 -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <template v-if="selectedDate">
          <h3 class="font-bold text-gray-800 mb-4">
            <i class="fas fa-users text-pink-500 mr-2" />{{ formatDateDisplay(selectedDate) }} 排班详情
          </h3>

          <div v-if="selectedDateByArtist.length === 0" class="text-center py-8 text-gray-400 text-sm">
            当日暂无排班记录
          </div>

          <div v-else class="space-y-3 max-h-[500px] overflow-y-auto">
            <div
              v-for="artist in selectedDateByArtist"
              :key="artist.id"
              class="p-3 rounded-lg border border-gray-100 hover:border-pink-200 transition-colors"
            >
              <div class="flex items-center gap-2 mb-2">
                <div class="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center">
                  <i class="fas fa-user text-pink-500 text-xs" />
                </div>
                <span class="font-medium text-gray-800 text-sm">{{ artist.name }}</span>
              </div>
              <div class="space-y-1 ml-8">
                <div
                  v-for="entry in artist.entries"
                  :key="entry.id"
                  class="flex items-center gap-2 text-xs"
                >
                  <span
                    v-if="!entry.time_slot"
                    class="px-1.5 py-0.5 bg-red-100 text-red-600 rounded"
                  >
                    整天休息
                  </span>
                  <span
                    v-else
                    class="px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded font-mono"
                  >
                    {{ entry.time_slot }} 不可用
                  </span>
                  <span v-if="entry.reason" class="text-gray-400">{{ entry.reason }}</span>
                </div>
              </div>
            </div>
          </div>
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
                  a.hasFullOff ? 'bg-red-400' : a.hasPartialOff ? 'bg-orange-400' : 'bg-green-400',
                ]"
              />
              <span>{{ a.name }}</span>
              <span v-if="a.hasFullOff" class="text-red-300">(休息)</span>
              <span v-else-if="a.hasPartialOff" class="text-orange-300">(部分)</span>
            </div>
          </div>
          <div class="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-transparent border-t-gray-900" />
        </div>
      </div>
    </Teleport>
  </div>
</template>
