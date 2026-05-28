<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const stats = ref<any>({})
const chartData = ref<any[]>([])
const revenueTrend = ref<any[]>([])
const monthlyStats = ref<any[]>([])
const userRegistrationTrend = ref<any[]>([])
const monthlyUserStats = ref<any[]>([])
const serviceBreakdown = ref<any[]>([])
const artistBreakdown = ref<any[]>([])
const recentAppointments = ref<any[]>([])
const loading = ref(true)

async function loadDashboard() {
  loading.value = true
  try {
    const data = await $fetch<any>('/api/admin/dashboard')
    stats.value = data.stats || {}
    chartData.value = data.chartData || []
    revenueTrend.value = data.revenueTrend || []
    monthlyStats.value = data.monthlyStats || []
    userRegistrationTrend.value = data.userRegistrationTrend || []
    monthlyUserStats.value = data.monthlyUserStats || []
    serviceBreakdown.value = data.serviceStats || []
    artistBreakdown.value = data.artistStats || []
    recentAppointments.value = data.recentAppointments || []
  } catch {}
  loading.value = false
}

function formatCurrency(val: number) {
  return (val || 0).toLocaleString('zh-CN')
}

// SVG 折线图工具函数
function buildLinePath(data: any[], valueKey: string, width: number, height: number, padding = 40) {
  if (!data.length) return { path: '', points: [] as any[], maxY: 0 }
  const values = data.map(d => Number(d[valueKey]) || 0)
  const maxY = Math.max(...values, 1)
  const xStep = (width - padding * 2) / Math.max(data.length - 1, 1)
  const yScale = (height - padding * 2) / maxY

  const points = data.map((d, i) => ({
    x: padding + i * xStep,
    y: height - padding - values[i] * yScale,
    value: values[i],
    label: d.date || d.month,
  }))

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  return { path, points, maxY }
}

// SVG 柱状图工具函数
function buildBarRects(data: any[], valueKey: string, width: number, height: number, padding = 40) {
  if (!data.length) return { rects: [] as any[], maxY: 0 }
  const values = data.map(d => Number(d[valueKey]) || 0)
  const maxY = Math.max(...values, 1)
  const barWidth = Math.min(40, (width - padding * 2) / data.length * 0.6)
  const gap = (width - padding * 2) / data.length

  const rects = data.map((d, i) => ({
    x: padding + i * gap + (gap - barWidth) / 2,
    y: height - padding - (values[i] / maxY) * (height - padding * 2),
    width: barWidth,
    barHeight: (values[i] / maxY) * (height - padding * 2),
    value: values[i],
    label: d.date || d.month,
  }))

  return { rects, maxY }
}

// 格式化日期显示（取月-日）
function formatShortDate(dateStr: string) {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : dateStr
}

// 格式化月份显示
function formatMonth(monthStr: string) {
  if (!monthStr) return ''
  const parts = monthStr.split('-')
  return parts.length >= 2 ? `${parts[1]}月` : monthStr
}

onMounted(loadDashboard)
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <i class="fas fa-spinner fa-spin text-3xl text-blue-500" />
    </div>

    <template v-else>
      <!-- Stat cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">总预约数</p>
              <p class="text-3xl font-bold text-gray-800 mt-1">{{ stats.totalAppointments || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <i class="fas fa-calendar-alt text-blue-500 text-xl" />
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">今日预约</p>
              <p class="text-3xl font-bold text-gray-800 mt-1">{{ stats.todayAppointments || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <i class="fas fa-clock text-green-500 text-xl" />
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">累计收入</p>
              <p class="text-3xl font-bold text-gray-800 mt-1">¥{{ formatCurrency(stats.totalRevenue) }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <i class="fas fa-yen-sign text-blue-500 text-xl" />
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">本月收入</p>
              <p class="text-3xl font-bold text-gray-800 mt-1">¥{{ formatCurrency(stats.monthRevenue) }}</p>
            </div>
            <div class="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <i class="fas fa-coins text-amber-500 text-xl" />
            </div>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">用户总数</p>
              <p class="text-3xl font-bold text-gray-800 mt-1">{{ stats.totalUsers || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <i class="fas fa-users text-purple-500 text-xl" />
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">今日新增</p>
              <p class="text-3xl font-bold text-gray-800 mt-1">{{ stats.todayNewUsers || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
              <i class="fas fa-user-plus text-teal-500 text-xl" />
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">本月新增</p>
              <p class="text-3xl font-bold text-gray-800 mt-1">{{ stats.monthNewUsers || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
              <i class="fas fa-user-friends text-cyan-500 text-xl" />
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">美甲师数</p>
              <p class="text-3xl font-bold text-gray-800 mt-1">{{ stats.totalArtists || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
              <i class="fas fa-palette text-rose-500 text-xl" />
            </div>
          </div>
        </div>
      </div>

      <!-- 折线图：预约趋势 + 收入趋势 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- 预约趋势折线图 -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">
            <i class="fas fa-chart-line text-blue-500 mr-2" />近30天预约趋势
          </h3>
          <div v-if="chartData.length" class="w-full overflow-x-auto">
            <svg :viewBox="`0 0 600 280`" class="w-full h-auto">
              <!-- 网格线 -->
              <line
                v-for="i in 4"
                :key="`grid-${i}`"
                :x1="40" :y1="40 + (i - 1) * 66.67"
                :x2="560" :y2="40 + (i - 1) * 66.67"
                stroke="#f3f4f6" stroke-width="1"
              />
              <!-- X轴 -->
              <line x1="40" y1="240" x2="560" y2="240" stroke="#e5e7eb" stroke-width="1" />
              <!-- 数据区域 -->
              <template v-if="buildLinePath(chartData, 'count', 600, 280).points.length">
                <!-- 渐变填充 -->
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3" />
                    <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.02" />
                  </linearGradient>
                </defs>
                <path
                  :d="buildLinePath(chartData, 'count', 600, 280).path + ` L 560 240 L 40 240 Z`"
                  fill="url(#blueGrad)"
                />
                <!-- 折线 -->
                <path
                  :d="buildLinePath(chartData, 'count', 600, 280).path"
                  fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                />
                <!-- 数据点 -->
                <circle
                  v-for="(p, i) in buildLinePath(chartData, 'count', 600, 280).points"
                  :key="i"
                  :cx="p.x" :cy="p.y" r="3"
                  fill="#3b82f6" stroke="white" stroke-width="1.5"
                />
                <!-- X轴标签（每隔几个显示） -->
                <template v-for="(p, i) in buildLinePath(chartData, 'count', 600, 280).points" :key="`label-${i}`">
                  <text
                    v-if="i % Math.max(1, Math.floor(chartData.length / 6)) === 0 || i === chartData.length - 1"
                    :x="p.x" y="258"
                    text-anchor="middle" font-size="10" fill="#9ca3af"
                  >
                    {{ formatShortDate(p.label) }}
                  </text>
                </template>
                <!-- Y轴标签 -->
                <text
                  v-for="i in 4" :key="`ylabel-${i}`"
                  x="35" :y="244 - (i - 1) * 66.67"
                  text-anchor="end" font-size="10" fill="#9ca3af"
                >
                  {{ Math.round(buildLinePath(chartData, 'count', 600, 280).maxY / 4 * i) }}
                </text>
              </template>
              <text v-else x="300" y="140" text-anchor="middle" font-size="14" fill="#d1d5db">暂无数据</text>
            </svg>
          </div>
          <p v-else class="text-center py-12 text-gray-400 text-sm">暂无预约数据</p>
        </div>

        <!-- 收入趋势折线图 -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">
            <i class="fas fa-chart-area text-green-500 mr-2" />近30天收入趋势
          </h3>
          <div v-if="revenueTrend.length" class="w-full overflow-x-auto">
            <svg :viewBox="`0 0 600 280`" class="w-full h-auto">
              <line
                v-for="i in 4"
                :key="`grid-${i}`"
                :x1="40" :y1="40 + (i - 1) * 66.67"
                :x2="560" :y2="40 + (i - 1) * 66.67"
                stroke="#f3f4f6" stroke-width="1"
              />
              <line x1="40" y1="240" x2="560" y2="240" stroke="#e5e7eb" stroke-width="1" />
              <template v-if="buildLinePath(revenueTrend, 'revenue', 600, 280).points.length">
                <defs>
                  <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#10b981" stop-opacity="0.3" />
                    <stop offset="100%" stop-color="#10b981" stop-opacity="0.02" />
                  </linearGradient>
                </defs>
                <path
                  :d="buildLinePath(revenueTrend, 'revenue', 600, 280).path + ` L 560 240 L 40 240 Z`"
                  fill="url(#greenGrad)"
                />
                <path
                  :d="buildLinePath(revenueTrend, 'revenue', 600, 280).path"
                  fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                />
                <circle
                  v-for="(p, i) in buildLinePath(revenueTrend, 'revenue', 600, 280).points"
                  :key="i"
                  :cx="p.x" :cy="p.y" r="3"
                  fill="#10b981" stroke="white" stroke-width="1.5"
                />
                <template v-for="(p, i) in buildLinePath(revenueTrend, 'revenue', 600, 280).points" :key="`label-${i}`">
                  <text
                    v-if="i % Math.max(1, Math.floor(revenueTrend.length / 6)) === 0 || i === revenueTrend.length - 1"
                    :x="p.x" y="258"
                    text-anchor="middle" font-size="10" fill="#9ca3af"
                  >
                    {{ formatShortDate(p.label) }}
                  </text>
                </template>
                <text
                  v-for="i in 4" :key="`ylabel-${i}`"
                  x="35" :y="244 - (i - 1) * 66.67"
                  text-anchor="end" font-size="10" fill="#9ca3af"
                >
                  ¥{{ Math.round(buildLinePath(revenueTrend, 'revenue', 600, 280).maxY / 4 * i) }}
                </text>
              </template>
              <text v-else x="300" y="140" text-anchor="middle" font-size="14" fill="#d1d5db">暂无数据</text>
            </svg>
          </div>
          <p v-else class="text-center py-12 text-gray-400 text-sm">暂无收入数据</p>
        </div>
      </div>

      <!-- 柱状图：月度预约 + 服务/美甲师统计 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- 月度预约柱状图 -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">
            <i class="fas fa-chart-bar text-purple-500 mr-2" />月度预约统计
          </h3>
          <div v-if="monthlyStats.length" class="w-full overflow-x-auto">
            <svg :viewBox="`0 0 500 260`" class="w-full h-auto">
              <line x1="40" y1="220" x2="460" y2="220" stroke="#e5e7eb" stroke-width="1" />
              <template v-if="buildBarRects(monthlyStats, 'count', 500, 260).rects.length">
                <defs>
                  <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#8b5cf6" />
                    <stop offset="100%" stop-color="#a78bfa" />
                  </linearGradient>
                </defs>
                <rect
                  v-for="(r, i) in buildBarRects(monthlyStats, 'count', 500, 260).rects"
                  :key="i"
                  :x="r.x" :y="r.y" :width="r.width" :height="r.barHeight"
                  fill="url(#purpleGrad)" rx="3"
                />
                <!-- 数值标签 -->
                <text
                  v-for="(r, i) in buildBarRects(monthlyStats, 'count', 500, 260).rects"
                  :key="`val-${i}`"
                  :x="r.x + r.width / 2" :y="r.y - 6"
                  text-anchor="middle" font-size="11" font-weight="600" fill="#7c3aed"
                >
                  {{ r.value }}
                </text>
                <!-- X轴标签 -->
                <text
                  v-for="(r, i) in buildBarRects(monthlyStats, 'count', 500, 260).rects"
                  :key="`mlabel-${i}`"
                  :x="r.x + r.width / 2" y="238"
                  text-anchor="middle" font-size="10" fill="#9ca3af"
                >
                  {{ formatMonth(r.label) }}
                </text>
              </template>
            </svg>
          </div>
          <p v-else class="text-center py-12 text-gray-400 text-sm">暂无月度数据</p>
        </div>

        <!-- 服务统计 -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">
            <i class="fas fa-spa text-blue-500 mr-2" />服务预约排行
          </h3>
          <div v-if="serviceBreakdown.length" class="space-y-3">
            <div v-for="(item, idx) in serviceBreakdown" :key="item.name" class="flex items-center">
              <span
                :class="[
                  'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mr-2 flex-shrink-0',
                  idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                  idx === 1 ? 'bg-gray-100 text-gray-600' :
                  idx === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-50 text-gray-400',
                ]"
              >{{ idx + 1 }}</span>
              <span class="text-sm text-gray-600 w-24 truncate">{{ item.name }}</span>
              <div class="flex-1 mx-3 bg-gray-100 rounded-full h-3">
                <div
                  class="h-3 rounded-full transition-all"
                  :class="idx === 0 ? 'bg-gradient-to-r from-blue-400 to-rose-400' : idx === 1 ? 'bg-gradient-to-r from-purple-400 to-violet-400' : 'bg-gradient-to-r from-blue-400 to-indigo-400'"
                  :style="{ width: `${Math.min(100, (item.count / (serviceBreakdown[0]?.count || 1)) * 100)}%` }"
                />
              </div>
              <span class="text-sm font-semibold text-gray-700 w-10 text-right">{{ item.count }}</span>
            </div>
          </div>
          <p v-else class="text-center py-12 text-gray-400 text-sm">暂无数据</p>
        </div>
      </div>

      <!-- 用户注册分析 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- 用户注册趋势折线图 -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">
            <i class="fas fa-user-plus text-teal-500 mr-2" />近30天注册趋势
          </h3>
          <div v-if="userRegistrationTrend.length" class="w-full overflow-x-auto">
            <svg :viewBox="`0 0 600 280`" class="w-full h-auto">
              <line
                v-for="i in 4" :key="`ugrid-${i}`"
                :x1="40" :y1="40 + (i - 1) * 66.67"
                :x2="560" :y2="40 + (i - 1) * 66.67"
                stroke="#f3f4f6" stroke-width="1"
              />
              <line x1="40" y1="240" x2="560" y2="240" stroke="#e5e7eb" stroke-width="1" />
              <template v-if="buildLinePath(userRegistrationTrend, 'count', 600, 280).points.length">
                <defs>
                  <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#14b8a6" stop-opacity="0.3" />
                    <stop offset="100%" stop-color="#14b8a6" stop-opacity="0.02" />
                  </linearGradient>
                </defs>
                <path
                  :d="buildLinePath(userRegistrationTrend, 'count', 600, 280).path + ` L 560 240 L 40 240 Z`"
                  fill="url(#tealGrad)"
                />
                <path
                  :d="buildLinePath(userRegistrationTrend, 'count', 600, 280).path"
                  fill="none" stroke="#14b8a6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                />
                <circle
                  v-for="(p, i) in buildLinePath(userRegistrationTrend, 'count', 600, 280).points"
                  :key="i"
                  :cx="p.x" :cy="p.y" r="3"
                  fill="#14b8a6" stroke="white" stroke-width="1.5"
                />
                <template v-for="(p, i) in buildLinePath(userRegistrationTrend, 'count', 600, 280).points" :key="`ulabel-${i}`">
                  <text
                    v-if="i % Math.max(1, Math.floor(userRegistrationTrend.length / 6)) === 0 || i === userRegistrationTrend.length - 1"
                    :x="p.x" y="258"
                    text-anchor="middle" font-size="10" fill="#9ca3af"
                  >
                    {{ formatShortDate(p.label) }}
                  </text>
                </template>
                <text
                  v-for="i in 4" :key="`uylabel-${i}`"
                  x="35" :y="244 - (i - 1) * 66.67"
                  text-anchor="end" font-size="10" fill="#9ca3af"
                >
                  {{ Math.round(buildLinePath(userRegistrationTrend, 'count', 600, 280).maxY / 4 * i) }}
                </text>
              </template>
              <text v-else x="300" y="140" text-anchor="middle" font-size="14" fill="#d1d5db">暂无数据</text>
            </svg>
          </div>
          <p v-else class="text-center py-12 text-gray-400 text-sm">暂无注册数据</p>
        </div>

        <!-- 月度注册柱状图 -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">
            <i class="fas fa-chart-bar text-cyan-500 mr-2" />月度注册统计
          </h3>
          <div v-if="monthlyUserStats.length" class="w-full overflow-x-auto">
            <svg :viewBox="`0 0 500 260`" class="w-full h-auto">
              <line x1="40" y1="220" x2="460" y2="220" stroke="#e5e7eb" stroke-width="1" />
              <template v-if="buildBarRects(monthlyUserStats, 'count', 500, 260).rects.length">
                <defs>
                  <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#06b6d4" />
                    <stop offset="100%" stop-color="#67e8f9" />
                  </linearGradient>
                </defs>
                <rect
                  v-for="(r, i) in buildBarRects(monthlyUserStats, 'count', 500, 260).rects"
                  :key="i"
                  :x="r.x" :y="r.y" :width="r.width" :height="r.barHeight"
                  fill="url(#cyanGrad)" rx="3"
                />
                <text
                  v-for="(r, i) in buildBarRects(monthlyUserStats, 'count', 500, 260).rects"
                  :key="`uval-${i}`"
                  :x="r.x + r.width / 2" :y="r.y - 6"
                  text-anchor="middle" font-size="11" font-weight="600" fill="#0891b2"
                >
                  {{ r.value }}
                </text>
                <text
                  v-for="(r, i) in buildBarRects(monthlyUserStats, 'count', 500, 260).rects"
                  :key="`umlabel-${i}`"
                  :x="r.x + r.width / 2" y="238"
                  text-anchor="middle" font-size="10" fill="#9ca3af"
                >
                  {{ formatMonth(r.label) }}
                </text>
              </template>
            </svg>
          </div>
          <p v-else class="text-center py-12 text-gray-400 text-sm">暂无注册数据</p>
        </div>
      </div>

      <!-- 美甲师业绩 + 最近预约 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- 美甲师业绩柱状图 -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">
            <i class="fas fa-user-tie text-indigo-500 mr-2" />美甲师业绩
          </h3>
          <div v-if="artistBreakdown.length" class="space-y-3">
            <div v-for="(item, idx) in artistBreakdown" :key="item.name" class="flex items-center">
              <div class="w-7 h-7 rounded-full flex items-center justify-center mr-2 flex-shrink-0"
                :class="idx === 0 ? 'bg-blue-100' : idx === 1 ? 'bg-purple-100' : 'bg-gray-100'"
              >
                <i class="fas fa-user text-xs" :class="idx === 0 ? 'text-blue-500' : idx === 1 ? 'text-purple-500' : 'text-gray-400'" />
              </div>
              <span class="text-sm text-gray-600 w-20 truncate">{{ item.name }}</span>
              <div class="flex-1 mx-3 bg-gray-100 rounded-full h-3">
                <div
                  class="h-3 rounded-full transition-all bg-gradient-to-r from-indigo-400 to-blue-400"
                  :style="{ width: `${Math.min(100, (item.count / (artistBreakdown[0]?.count || 1)) * 100)}%` }"
                />
              </div>
              <span class="text-sm font-semibold text-gray-700 w-10 text-right">{{ item.count }}</span>
            </div>
          </div>
          <p v-else class="text-center py-12 text-gray-400 text-sm">暂无数据</p>
        </div>

        <!-- 最近预约 -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100">
          <div class="p-6 border-b border-gray-100">
            <h3 class="text-lg font-semibold text-gray-800">
              <i class="fas fa-clock text-amber-500 mr-2" />最近预约
            </h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">服务</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日期</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="a in recentAppointments" :key="a.id" class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm text-gray-800">{{ a.customer_name }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ a.serviceName || '-' }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ a.date }} {{ a.time }}</td>
                  <td class="px-4 py-3">
                    <span
                      :class="[
                        'px-2 py-1 text-xs rounded-full font-medium',
                        a.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                        a.status === 'completed' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700',
                      ]"
                    >
                      {{ a.status === 'upcoming' ? '待服务' : a.status === 'completed' ? '已完成' : '已取消' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-if="!recentAppointments.length" class="text-center py-8 text-gray-400 text-sm">暂无预约记录</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
