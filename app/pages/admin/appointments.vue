<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const items = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const status = ref('')
const date = ref('')
const keyword = ref('')
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.set('page', String(page.value))
    params.set('pageSize', String(pageSize.value))
    if (status.value) params.set('status', status.value)
    if (date.value) params.set('date', date.value)
    if (keyword.value) params.set('keyword', keyword.value)
    const data = await $fetch<any>(`/api/admin/appointments?${params}`)
    items.value = data.items || []
    total.value = data.total || 0
  } catch {}
  loading.value = false
}

async function updateStatus(id: number, newStatus: string) {
  try {
    await $fetch(`/api/admin/appointments/${id}`, {
      method: 'PATCH',
      body: { status: newStatus },
    })
    load()
  } catch {}
}

async function remove(id: number) {
  if (!confirm('确定要删除这条预约吗？')) return
  try {
    await $fetch(`/api/admin/appointments/${id}`, { method: 'DELETE' })
    load()
  } catch {}
}

function resetFilters() {
  status.value = ''
  date.value = ''
  keyword.value = ''
  page.value = 1
  load()
}

function statusLabel(s: string) {
  return s === 'upcoming' ? '待服务' : s === 'completed' ? '已完成' : '已取消'
}

function statusClass(s: string) {
  return s === 'upcoming' ? 'bg-blue-100 text-blue-700' :
    s === 'completed' ? 'bg-green-100 text-green-700' :
    'bg-gray-100 text-gray-700'
}

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

watch(page, load)
onMounted(load)
</script>

<template>
  <div>
    <!-- Filters -->
    <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
      <div class="flex flex-wrap gap-4 items-end">
        <div>
          <label class="block text-sm text-gray-600 mb-1">状态</label>
          <select v-model="status" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-pink-400 outline-none">
            <option value="">全部</option>
            <option value="upcoming">待服务</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">日期</label>
          <input v-model="date" type="date" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-pink-400 outline-none" />
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">关键词</label>
          <input v-model="keyword" type="text" placeholder="客户名/电话" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-pink-400 outline-none w-40" />
        </div>
        <div class="flex gap-2">
          <button class="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm hover:bg-pink-600" @click="page = 1; load()">
            <i class="fas fa-search mr-1" />搜索
          </button>
          <button class="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200" @click="resetFilters">
            重置
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">电话</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">服务</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">美甲师</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日期/时间</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="a in items" :key="a.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 text-sm text-gray-500">{{ a.id }}</td>
              <td class="px-6 py-4 text-sm font-medium text-gray-800">{{ a.customer_name }}</td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ a.customer_phone || '-' }}</td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ a.serviceName || '-' }}</td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ a.artistName || '未指定' }}</td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ a.date }} {{ a.time }}</td>
              <td class="px-6 py-4">
                <span :class="['px-2 py-1 text-xs rounded-full font-medium', statusClass(a.status)]">
                  {{ statusLabel(a.status) }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm">
                <div class="flex gap-2">
                  <button
                    v-if="a.status === 'upcoming'"
                    class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                    @click="updateStatus(a.id, 'completed')"
                  >
                    完成
                  </button>
                  <button
                    v-if="a.status === 'upcoming'"
                    class="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200"
                    @click="updateStatus(a.id, 'cancelled')"
                  >
                    取消
                  </button>
                  <button
                    class="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                    @click="remove(a.id)"
                  >
                    删除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!items.length && !loading" class="text-center py-8 text-gray-400">暂无预约记录</p>
        <div v-if="loading" class="text-center py-8">
          <i class="fas fa-spinner fa-spin text-pink-500 text-xl" />
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between px-6 py-4 border-t border-gray-100">
        <span class="text-sm text-gray-500">共 {{ total }} 条记录</span>
        <div class="flex gap-1">
          <button
            :disabled="page <= 1"
            class="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-40"
            @click="page--"
          >
            上一页
          </button>
          <button
            v-for="p in totalPages"
            :key="p"
            :class="['px-3 py-1 text-sm border rounded', p === page ? 'bg-pink-500 text-white border-pink-500' : 'hover:bg-gray-50']"
            @click="page = p"
          >
            {{ p }}
          </button>
          <button
            :disabled="page >= totalPages"
            class="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-40"
            @click="page++"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
