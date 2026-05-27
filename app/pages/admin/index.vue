<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const stats = ref<any>({})
const chartData = ref<any>({})
const serviceBreakdown = ref<any[]>([])
const artistBreakdown = ref<any[]>([])
const recentAppointments = ref<any[]>([])
const loading = ref(true)

async function loadDashboard() {
  loading.value = true
  try {
    const data = await $fetch<any>('/api/admin/dashboard')
    stats.value = data.stats || {}
    chartData.value = data.chartData || {}
    serviceBreakdown.value = data.serviceStats || []
    artistBreakdown.value = data.artistStats || []
    recentAppointments.value = data.recentAppointments || []
  } catch {}
  loading.value = false
}

function formatCurrency(val: number) {
  return (val || 0).toLocaleString('zh-CN')
}

onMounted(loadDashboard)
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <i class="fas fa-spinner fa-spin text-3xl text-pink-500" />
    </div>

    <template v-else>
      <!-- Stat cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <p class="text-sm text-gray-500">累计收入</p>
              <p class="text-3xl font-bold text-gray-800 mt-1">¥{{ formatCurrency(stats.totalRevenue) }}</p>
            </div>
            <div class="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
              <i class="fas fa-yen-sign text-pink-500 text-xl" />
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Service breakdown -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">
            <i class="fas fa-spa text-pink-500 mr-2" />服务统计
          </h3>
          <div v-if="serviceBreakdown.length" class="space-y-3">
            <div v-for="item in serviceBreakdown" :key="item.name" class="flex items-center">
              <span class="text-sm text-gray-600 w-28 truncate">{{ item.name }}</span>
              <div class="flex-1 mx-3 bg-gray-100 rounded-full h-3">
                <div
                  class="bg-gradient-to-r from-pink-400 to-purple-400 h-3 rounded-full transition-all"
                  :style="{ width: `${Math.min(100, (item.count / (serviceBreakdown[0]?.count || 1)) * 100)}%` }"
                />
              </div>
              <span class="text-sm font-semibold text-gray-700 w-10 text-right">{{ item.count }}</span>
            </div>
          </div>
          <p v-else class="text-gray-400 text-sm">暂无数据</p>
        </div>

        <!-- Artist breakdown -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">
            <i class="fas fa-user-tie text-purple-500 mr-2" />美甲师业绩
          </h3>
          <div v-if="artistBreakdown.length" class="space-y-3">
            <div v-for="item in artistBreakdown" :key="item.name" class="flex items-center">
              <span class="text-sm text-gray-600 w-24 truncate">{{ item.name }}</span>
              <div class="flex-1 mx-3 bg-gray-100 rounded-full h-3">
                <div
                  class="bg-gradient-to-r from-purple-400 to-indigo-400 h-3 rounded-full transition-all"
                  :style="{ width: `${Math.min(100, (item.count / (artistBreakdown[0]?.count || 1)) * 100)}%` }"
                />
              </div>
              <span class="text-sm font-semibold text-gray-700 w-10 text-right">{{ item.count }}</span>
            </div>
          </div>
          <p v-else class="text-gray-400 text-sm">暂无数据</p>
        </div>
      </div>

      <!-- Recent appointments -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100">
        <div class="p-6 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800">
            <i class="fas fa-clock text-indigo-500 mr-2" />最近预约
          </h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">服务</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日期</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="a in recentAppointments" :key="a.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 text-sm text-gray-800">{{ a.customer_name }}</td>
                <td class="px-6 py-4 text-sm text-gray-600">{{ a.serviceName || '-' }}</td>
                <td class="px-6 py-4 text-sm text-gray-600">{{ a.date }} {{ a.time }}</td>
                <td class="px-6 py-4">
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
          <p v-if="!recentAppointments.length" class="text-center py-8 text-gray-400">暂无预约记录</p>
        </div>
      </div>
    </template>
  </div>
</template>
