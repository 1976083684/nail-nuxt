<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { showToast } = useToast()

const artists = ref<any[]>([])
const selectedArtist = ref<number | null>(null)
const artistSearch = ref('')
const showArtistDropdown = ref(false)
const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth())
const searchMode = ref<'month' | 'year'>('month')
const loading = ref(false)
const saving = ref(false)
const schedules = ref<any[]>([])
const totalSlots = ref(0)

// 分页
const page = ref(1)
const pageSize = ref(20)
const pageSizeOptions = [10, 20, 50, 100]

// 悬停气泡
const hoverDate = ref<string | null>(null)
const hoverX = ref(0)
const hoverY = ref(0)

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

// 按天聚合排班记录
interface DayRecord {
  dateStr: string
  weekday: string
  isFullOff: boolean
  availableSlots: string[]
  unavailableCount: number
  reason: string
  ids: number[]
}

const dayRecords = computed<DayRecord[]>(() => {
  const map = new Map<string, DayRecord>()
  const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

  for (const s of schedules.value) {
    const dateStr = String(s.date).substring(0, 10)
    if (!map.has(dateStr)) {
      const d = new Date(dateStr + 'T00:00:00')
      map.set(dateStr, {
        dateStr,
        weekday: weekdayNames[d.getDay()],
        isFullOff: false,
        availableSlots: [],
        unavailableCount: 0,
        reason: '',
        ids: [],
      })
    }
    const day = map.get(dateStr)!
    day.ids.push(s.id)
    if (!s.time_slot) {
      day.isFullOff = true
      day.reason = s.reason || ''
    } else {
      if (s.is_unavailable) {
        day.unavailableCount++
      } else {
        day.availableSlots.push(s.time_slot)
      }
      if (s.reason && !day.reason) day.reason = s.reason
    }
  }

  return Array.from(map.values()).sort((a, b) => a.dateStr.localeCompare(b.dateStr))
})

// 分页数据
const totalPages = computed(() => Math.max(1, Math.ceil(dayRecords.value.length / pageSize.value)))
const paginatedRecords = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return dayRecords.value.slice(start, start + pageSize.value)
})

// 切换分页大小
function changePageSize(size: number) {
  pageSize.value = size
  page.value = 1
}

// 统计：休息天数按PD算，1PD=1整天休息，部分休息按占比
const stats = computed(() => {
  const totalDays = dayRecords.value.length
  const totalPD = dayRecords.value.reduce((sum, d) => {
    if (d.isFullOff) return sum + 1
    if (totalSlots.value > 0 && d.unavailableCount > 0) {
      return sum + d.unavailableCount / totalSlots.value
    }
    return sum
  }, 0)
  return { totalDays, totalPD: Math.round(totalPD * 100) / 100 }
})

// 日期范围
const dateRange = computed(() => {
  if (searchMode.value === 'year') {
    return {
      start: `${viewYear.value}-01-01`,
      end: `${viewYear.value}-12-31`,
    }
  }
  return {
    start: `${viewYear.value}-${String(viewMonth.value + 1).padStart(2, '0')}-01`,
    end: `${viewYear.value}-${String(viewMonth.value + 1).padStart(2, '0')}-${new Date(viewYear.value, viewMonth.value + 1, 0).getDate()}`,
  }
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

// 加载时间段配置
async function loadTimeSlots() {
  try {
    const settings = await $fetch<any[]>('/api/admin/settings')
    const startH = settings.find((s: any) => s.setting_key === 'business_hours_start')?.setting_value || '10:00'
    const endH = settings.find((s: any) => s.setting_key === 'business_hours_end')?.setting_value || '19:00'
    const duration = Number(settings.find((s: any) => s.setting_key === 'slot_duration')?.setting_value) || 30
    const [sh, sm] = startH.split(':').map(Number)
    const [eh, em] = endH.split(':').map(Number)
    let count = 0
    let minutes = sh * 60 + sm
    const endMinutes = eh * 60 + em
    while (minutes < endMinutes) { count++; minutes += duration }
    totalSlots.value = count
  } catch {
    totalSlots.value = 18
  }
}

// 加载排班数据
async function loadSchedules() {
  if (!selectedArtist.value) return
  loading.value = true
  try {
    schedules.value = await $fetch<any[]>('/api/admin/schedules', {
      query: { artistId: selectedArtist.value, startDate: dateRange.value.start, endDate: dateRange.value.end },
    })
  } catch (e) {
    console.error('加载排班失败:', e)
  }
  loading.value = false
}

// 选择美甲师
function selectArtist(artist: any) {
  selectedArtist.value = artist.id
  artistSearch.value = artist.name
  showArtistDropdown.value = false
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

// 切换月份/年份
function changePeriod(delta: number) {
  if (searchMode.value === 'year') {
    viewYear.value += delta
  } else {
    viewMonth.value += delta
    if (viewMonth.value > 11) { viewMonth.value = 0; viewYear.value++ }
    if (viewMonth.value < 0) { viewMonth.value = 11; viewYear.value-- }
  }
  loadSchedules()
}

function switchSearchMode(mode: 'month' | 'year') {
  searchMode.value = mode
  loadSchedules()
}

// 气泡
function onRowMouseEnter(e: MouseEvent, dateStr: string) {
  hoverDate.value = dateStr
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  hoverX.value = rect.left + rect.width / 2
  hoverY.value = rect.top - 8
}
function onRowMouseLeave() {
  hoverDate.value = null
}

const hoverDayAllSlots = computed(() => {
  if (!hoverDate.value) return []
  const day = dayRecords.value.find(d => d.dateStr === hoverDate.value)
  if (!day) return []
  return day.availableSlots
})

// 删除某天的所有排班
async function deleteDay(day: DayRecord) {
  if (!confirm(`确定删除 ${day.dateStr} 的排班记录？`)) return
  try {
    for (const id of day.ids) {
      await $fetch(`/api/admin/schedules/${id}`, { method: 'DELETE' })
    }
    await loadSchedules()
    showToast('删除成功', 'success')
  } catch {
    showToast('删除失败', 'error')
  }
}

// 批量删除
async function deleteAll() {
  const label = searchMode.value === 'year' ? `${viewYear.value}年` : `${viewYear.value}年${viewMonth.value + 1}月`
  if (!confirm(`确定删除 ${selectedArtistName.value} ${label} 的所有排班记录？`)) return
  saving.value = true
  try {
    for (const s of schedules.value) {
      await $fetch(`/api/admin/schedules/${s.id}`, { method: 'DELETE' })
    }
    await loadSchedules()
    showToast('清空成功', 'success')
  } catch {
    showToast('操作失败', 'error')
  }
  saving.value = false
}

function handleGlobalClick(e: MouseEvent) {
  if (!(e.target as HTMLElement).closest('.artist-dropdown-wrapper')) {
    showArtistDropdown.value = false
    if (selectedArtist.value) artistSearch.value = selectedArtistName.value
  }
}

onMounted(async () => {
  document.addEventListener('click', handleGlobalClick)
  await Promise.all([loadArtists(), loadTimeSlots()])
  await loadSchedules()
})

onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClick)
})

watch(selectedArtist, () => { loadSchedules() })
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">
        <i class="fas fa-list-alt text-blue-500 mr-2" />排班记录
      </h2>
      <NuxtLink
        to="/admin/schedules"
        class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
      >
        <i class="fas fa-arrow-left mr-1" />返回总览
      </NuxtLink>
    </div>

    <!-- 筛选栏 + 统计 -->
    <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
      <div class="flex flex-wrap items-center gap-4">
        <!-- 统计内联 -->
        <div class="flex items-center gap-4 mr-2">
          <div class="flex items-center gap-1.5">
            <span class="text-xs text-gray-500">排班天数</span>
            <span class="text-sm font-bold text-blue-500">{{ stats.totalDays }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-xs text-gray-500">休息</span>
            <span class="text-sm font-bold text-red-500">{{ stats.totalPD }} PD</span>
          </div>
        </div>
        <div class="h-5 w-px bg-gray-200" />
        <!-- 美甲师 -->
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700">美甲师：</label>
          <div class="relative artist-dropdown-wrapper min-w-[140px]">
            <div class="relative">
              <input
                v-model="artistSearch"
                type="text"
                class="w-full px-3 py-2 pr-8 border rounded-lg text-sm focus:border-blue-400 outline-none"
                placeholder="搜索..."
                @focus="onArtistSearchFocus"
                @input="showArtistDropdown = true"
              />
              <i
                class="fas fa-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs cursor-pointer hover:text-blue-500"
                @click.stop="showArtistDropdown = !showArtistDropdown"
              />
            </div>
            <div
              v-if="showArtistDropdown && filteredArtists.length > 0"
              class="absolute z-20 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-[200px] overflow-y-auto"
            >
              <div
                v-for="a in filteredArtists"
                :key="a.id"
                :class="[
                  'px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 transition-colors',
                  selectedArtist === a.id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700',
                ]"
                @mousedown.prevent="selectArtist(a)"
              >
                {{ a.name }}
              </div>
            </div>
          </div>
        </div>

        <!-- 搜索模式切换 -->
        <div class="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            :class="['px-3 py-1.5 rounded-md text-sm transition-colors', searchMode === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700']"
            @click="switchSearchMode('month')"
          >
            按月
          </button>
          <button
            :class="['px-3 py-1.5 rounded-md text-sm transition-colors', searchMode === 'year' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700']"
            @click="switchSearchMode('year')"
          >
            按年
          </button>
        </div>

        <!-- 时间切换 -->
        <div class="flex items-center gap-2">
          <button class="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100" @click="changePeriod(-1)">
            <i class="fas fa-chevron-left text-gray-500 text-sm" />
          </button>
          <span class="font-medium text-gray-700 text-sm min-w-[100px] text-center">
            <template v-if="searchMode === 'year'">{{ viewYear }}年</template>
            <template v-else>{{ viewYear }}年{{ viewMonth + 1 }}月</template>
          </span>
          <button class="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100" @click="changePeriod(1)">
            <i class="fas fa-chevron-right text-gray-500 text-sm" />
          </button>
        </div>

        <div class="flex-1" />

        <!-- 操作按钮 -->
        <div class="flex gap-2">
          <NuxtLink
            to="/admin/schedules/create"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
          >
            <i class="fas fa-plus mr-1" />新增排班
          </NuxtLink>
          <button
            v-if="dayRecords.length > 0"
            class="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 border border-red-200"
            @click="deleteAll"
          >
            <i class="fas fa-trash mr-1" />清空
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center py-20">
      <i class="fas fa-spinner fa-spin text-blue-500 text-3xl" />
    </div>

    <!-- 记录列表 -->
    <div v-else class="bg-white rounded-xl shadow-sm border border-gray-100">
      <div v-if="dayRecords.length === 0" class="text-center py-16 text-gray-400">
        <i class="fas fa-calendar-times text-4xl mb-3" />
        <p class="text-sm">暂无排班记录</p>
        <NuxtLink to="/admin/schedules/create" class="text-blue-500 text-sm hover:underline mt-2 inline-block">
          去新增排班
        </NuxtLink>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50">
              <th class="text-left py-3 px-4 font-medium text-gray-600">日期</th>
              <th class="text-left py-3 px-4 font-medium text-gray-600">星期</th>
              <th class="text-left py-3 px-4 font-medium text-gray-600">状态</th>
              <th class="text-left py-3 px-4 font-medium text-gray-600">可预约时间段</th>
              <th class="text-left py-3 px-4 font-medium text-gray-600">原因</th>
              <th class="text-right py-3 px-4 font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="day in paginatedRecords"
              :key="day.dateStr"
              class="border-b border-gray-50 hover:bg-blue-50/30 transition-colors"
              @mouseenter="onRowMouseEnter($event, day.dateStr)"
              @mouseleave="onRowMouseLeave"
            >
              <td class="py-3 px-4 font-medium text-gray-800">
                {{ day.dateStr }}
              </td>
              <td class="py-3 px-4 text-gray-500">
                {{ day.weekday }}
              </td>
              <td class="py-3 px-4">
                <span
                  v-if="day.isFullOff"
                  class="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs"
                >
                  整天休息
                </span>
                <span
                  v-else-if="day.unavailableCount > 0"
                  class="px-2 py-1 bg-yellow-100 text-yellow-600 rounded-full text-xs"
                >
                  部分排班
                </span>
                <span
                  v-else
                  class="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs"
                >
                  全排
                </span>
              </td>
              <td class="py-3 px-4 font-mono text-gray-600 text-xs">
                <template v-if="day.isFullOff">--</template>
                <template v-else-if="day.availableSlots.length === 0">无</template>
                <template v-else>
                  {{ day.availableSlots.slice(0, 10).join('，') }}<span v-if="day.availableSlots.length > 10" class="text-gray-400">...</span>
                </template>
              </td>
              <td class="py-3 px-4 text-gray-500 max-w-[200px] truncate">
                {{ day.reason || '-' }}
              </td>
              <td class="py-3 px-4 text-right">
                <button
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50"
                  title="删除"
                  @click="deleteDay(day)"
                >
                  <i class="fas fa-trash text-xs" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <!-- 分页控件 -->
        <div class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <span>共 {{ dayRecords.length }} 条</span>
            <span class="text-gray-300">|</span>
            <span>每页</span>
            <select
              :value="pageSize"
              class="border border-gray-200 rounded px-2 py-1 text-sm focus:border-blue-400 outline-none"
              @change="changePageSize(Number(($event.target as HTMLSelectElement).value))"
            >
              <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
            </select>
            <span>条</span>
          </div>
          <div class="flex items-center gap-1">
            <button
              class="w-8 h-8 rounded flex items-center justify-center text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="page <= 1"
              @click="page--"
            >
              <i class="fas fa-chevron-left text-xs" />
            </button>
            <template v-for="p in totalPages" :key="p">
              <button
                v-if="p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)"
                :class="[
                  'w-8 h-8 rounded flex items-center justify-center text-sm',
                  p === page ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 text-gray-600',
                ]"
                @click="page = p"
              >
                {{ p }}
              </button>
              <span v-else-if="p === page - 2 || p === page + 2" class="text-gray-400 px-1">...</span>
            </template>
            <button
              class="w-8 h-8 rounded flex items-center justify-center text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="page >= totalPages"
              @click="page++"
            >
              <i class="fas fa-chevron-right text-xs" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 悬停气泡：显示全部可预约时间段 -->
    <Teleport to="body">
      <div
        v-if="hoverDate && hoverDayAllSlots.length > 10"
        class="fixed z-[9999] pointer-events-none"
        :style="{ left: hoverX + 'px', top: hoverY + 'px', transform: 'translate(-50%, -100%)' }"
      >
        <div class="bg-gray-900 text-white rounded-lg px-3 py-2 shadow-xl text-xs whitespace-nowrap max-w-[320px]">
          <div class="font-medium mb-1 border-b border-gray-700 pb-1">
            {{ hoverDate }} 可预约时间段
          </div>
          <div class="flex flex-wrap gap-1 max-w-[300px]">
            <span v-for="slot in hoverDayAllSlots" :key="slot" class="px-1.5 py-0.5 bg-gray-700 rounded font-mono">{{ slot }}</span>
          </div>
          <div class="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-transparent border-t-gray-900" />
        </div>
      </div>
    </Teleport>
  </div>
</template>
