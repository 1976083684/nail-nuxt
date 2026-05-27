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
const schedules = ref<any[]>([])

// 时间段配置
const timeSlots = ref<string[]>([])

// 编辑弹窗
const showEditModal = ref(false)
const editForm = ref({
  id: null as number | null,
  artistId: null as number | null,
  date: '',
  timeSlot: '',
  reason: '',
})

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

// 排班记录（按日期排序）
const records = computed(() => {
  return schedules.value.map(s => {
    const d = typeof s.date === 'string' ? s.date.split('T')[0] : new Date(s.date).toISOString().split('T')[0]
    return { ...s, dateStr: d }
  }).sort((a, b) => a.dateStr.localeCompare(b.dateStr))
})

// 统计
const stats = computed(() => {
  const dates = new Set(records.value.map(r => r.dateStr))
  const fullOffDates = new Set(records.value.filter(r => !r.time_slot).map(r => r.dateStr))
  return {
    totalRecords: records.value.length,
    totalDays: dates.size,
    fullOffDays: fullOffDates.size,
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

// 加载时间段
async function loadTimeSlots() {
  try {
    const settings = await $fetch<any[]>('/api/admin/settings')
    const startH = settings.find(s => s.setting_key === 'business_hours_start')?.setting_value || '10:00'
    const endH = settings.find(s => s.setting_key === 'business_hours_end')?.setting_value || '19:00'
    const duration = Number(settings.find(s => s.setting_key === 'slot_duration')?.setting_value) || 30

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

// 切换月份
function changeMonth(delta: number) {
  viewMonth.value += delta
  if (viewMonth.value > 11) { viewMonth.value = 0; viewYear.value++ }
  if (viewMonth.value < 0) { viewMonth.value = 11; viewYear.value-- }
  loadSchedules()
}

// 打开编辑弹窗
function openEditModal(record: any) {
  editForm.value = {
    id: record.id,
    artistId: record.artist_id,
    date: record.dateStr,
    timeSlot: record.time_slot || '',
    reason: record.reason || '',
  }
  showEditModal.value = true
}

// 保存编辑
async function saveEdit() {
  if (!editForm.value.artistId || !editForm.value.date) return
  saving.value = true
  try {
    if (editForm.value.id) {
      await $fetch(`/api/admin/schedules/${editForm.value.id}`, { method: 'DELETE' })
    }
    await $fetch('/api/admin/schedules', {
      method: 'POST',
      body: {
        artistId: editForm.value.artistId,
        date: editForm.value.date,
        timeSlot: editForm.value.timeSlot || null,
        reason: editForm.value.reason,
      },
    })
    showEditModal.value = false
    await loadSchedules()
  } catch {
    alert('保存失败')
  }
  saving.value = false
}

// 删除记录
async function deleteRecord(id: number) {
  if (!confirm('确定删除此排班记录？')) return
  try {
    await $fetch(`/api/admin/schedules/${id}`, { method: 'DELETE' })
    await loadSchedules()
  } catch {
    alert('删除失败')
  }
}

// 批量删除当月记录
async function deleteAllMonth() {
  if (!confirm(`确定删除 ${selectedArtistName.value} ${viewYear}年${viewMonth + 1}月的所有排班记录？`)) return
  saving.value = true
  try {
    for (const s of schedules.value) {
      await $fetch(`/api/admin/schedules/${s.id}`, { method: 'DELETE' })
    }
    await loadSchedules()
  } catch {
    alert('删除失败')
  }
  saving.value = false
}

function formatDateDisplay(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const w = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getMonth() + 1}月${d.getDate()}日 ${w[d.getDay()]}`
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
        <i class="fas fa-list-alt text-pink-500 mr-2" />排班记录
      </h2>
      <NuxtLink
        to="/admin/schedules"
        class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
      >
        <i class="fas fa-arrow-left mr-1" />返回总览
      </NuxtLink>
    </div>

    <!-- 筛选栏 -->
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

        <!-- 月份切换 -->
        <div class="flex items-center gap-2">
          <button class="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100" @click="changeMonth(-1)">
            <i class="fas fa-chevron-left text-gray-500 text-sm" />
          </button>
          <span class="font-medium text-gray-700 text-sm min-w-[100px] text-center">{{ viewYear }}年{{ viewMonth + 1 }}月</span>
          <button class="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100" @click="changeMonth(1)">
            <i class="fas fa-chevron-right text-gray-500 text-sm" />
          </button>
        </div>

        <div class="flex-1" />

        <!-- 操作按钮 -->
        <div class="flex gap-2">
          <NuxtLink
            to="/admin/schedules/create"
            class="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm hover:bg-pink-600"
          >
            <i class="fas fa-plus mr-1" />新增排班
          </NuxtLink>
          <button
            v-if="records.length > 0"
            class="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 border border-red-200"
            @click="deleteAllMonth"
          >
            <i class="fas fa-trash mr-1" />清空当月
          </button>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-3 gap-4 mb-4">
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
        <div class="text-2xl font-bold text-pink-500">{{ stats.totalDays }}</div>
        <div class="text-xs text-gray-500 mt-1">排班天数</div>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
        <div class="text-2xl font-bold text-orange-500">{{ stats.totalRecords }}</div>
        <div class="text-xs text-gray-500 mt-1">排班记录</div>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
        <div class="text-2xl font-bold text-red-500">{{ stats.fullOffDays }}</div>
        <div class="text-xs text-gray-500 mt-1">休息天数</div>
      </div>
    </div>

    <div v-if="loading" class="text-center py-20">
      <i class="fas fa-spinner fa-spin text-pink-500 text-3xl" />
    </div>

    <!-- 记录列表 -->
    <div v-else class="bg-white rounded-xl shadow-sm border border-gray-100">
      <div v-if="records.length === 0" class="text-center py-16 text-gray-400">
        <i class="fas fa-calendar-times text-4xl mb-3" />
        <p class="text-sm">暂无排班记录</p>
        <NuxtLink to="/admin/schedules/create" class="text-pink-500 text-sm hover:underline mt-2 inline-block">
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
              <th class="text-left py-3 px-4 font-medium text-gray-600">时间段</th>
              <th class="text-left py-3 px-4 font-medium text-gray-600">原因</th>
              <th class="text-right py-3 px-4 font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="record in records"
              :key="record.id"
              class="border-b border-gray-50 hover:bg-pink-50/30 transition-colors"
            >
              <td class="py-3 px-4 font-medium text-gray-800">
                {{ record.dateStr }}
              </td>
              <td class="py-3 px-4 text-gray-500">
                {{ formatDateDisplay(record.dateStr).split(' ')[1] }}
              </td>
              <td class="py-3 px-4">
                <span
                  v-if="!record.time_slot"
                  class="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs"
                >
                  整天休息
                </span>
                <span
                  v-else
                  class="px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-xs"
                >
                  部分不可用
                </span>
              </td>
              <td class="py-3 px-4 font-mono text-gray-600">
                {{ record.time_slot || '--' }}
              </td>
              <td class="py-3 px-4 text-gray-500 max-w-[200px] truncate">
                {{ record.reason || '-' }}
              </td>
              <td class="py-3 px-4 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                    title="编辑"
                    @click="openEditModal(record)"
                  >
                    <i class="fas fa-pen text-xs" />
                  </button>
                  <button
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50"
                    title="删除"
                    @click="deleteRecord(record.id)"
                  >
                    <i class="fas fa-trash text-xs" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <Teleport to="body">
      <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
          <h3 class="font-bold text-gray-800 mb-4">
            <i class="fas fa-edit text-pink-500 mr-2" />编辑排班
          </h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">美甲师</label>
              <select v-model="editForm.artistId" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-pink-400 outline-none">
                <option v-for="a in artists" :key="a.id" :value="a.id">{{ a.name }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">日期</label>
              <input
                :value="editForm.date"
                type="date"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:border-pink-400 outline-none"
                @change="editForm.date = ($event.target as HTMLInputElement).value"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">时间段（留空表示整天）</label>
              <select v-model="editForm.timeSlot" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-pink-400 outline-none">
                <option value="">整天不可用</option>
                <option v-for="slot in timeSlots" :key="slot" :value="slot">{{ slot }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">原因</label>
              <input
                v-model="editForm.reason"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:border-pink-400 outline-none"
                placeholder="如：休息、请假"
              />
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button class="px-4 py-2 text-gray-600 rounded-lg text-sm hover:bg-gray-100" @click="showEditModal = false">
              取消
            </button>
            <button
              class="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm hover:bg-pink-600 disabled:opacity-50"
              :disabled="saving"
              @click="saveEdit"
            >
              <i v-if="saving" class="fas fa-spinner fa-spin mr-1" />
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
