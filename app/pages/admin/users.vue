<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const items = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const keyword = ref('')
const loading = ref(false)
const selected = ref<any>(null)
const detail = ref<any>(null)
const detailLoading = ref(false)
const editing = ref(false)
const editId = ref<number | null>(null)
const form = ref<any>({ name: '', phone: '', avatar_url: '' })
const { showToast } = useToast()

async function load() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.set('page', String(page.value))
    params.set('pageSize', String(pageSize.value))
    if (keyword.value) params.set('keyword', keyword.value)
    const data = await $fetch<any>(`/api/admin/users?${params}`)
    items.value = data.items || []
    total.value = data.total || 0
  } catch {}
  loading.value = false
}

async function viewDetail(id: number) {
  detailLoading.value = true
  try {
    detail.value = await $fetch<any>(`/api/admin/users/${id}`)
    selected.value = id
  } catch {}
  detailLoading.value = false
}

function closeDetail() {
  selected.value = null
  detail.value = null
}

function openEdit(item: any) {
  editId.value = item.id
  form.value = { name: item.name || '', phone: item.phone || '', avatar_url: item.avatar_url || '' }
  editing.value = true
}

async function save() {
  try {
    await $fetch(`/api/admin/users/${editId.value}`, { method: 'PUT', body: form.value })
    editing.value = false
    showToast('保存成功', 'success')
    load()
  } catch (e: any) {
    showToast(e?.data?.message || '保存失败', 'error')
  }
}

async function remove(id: number) {
  if (!confirm('确定要删除此用户吗？该用户的预约和点赞记录也会一并删除。')) return
  try {
    await $fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    showToast('删除成功', 'success')
    if (selected.value === id) closeDetail()
    load()
  } catch (e: any) {
    showToast(e?.data?.message || '删除失败', 'error')
  }
}

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

watch(page, load)
onMounted(load)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">用户管理</h2>
      <div class="flex gap-2">
        <input
          v-model="keyword"
          placeholder="搜索用户名或电话"
          class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 outline-none w-60"
          @keyup.enter="page = 1; load()"
        />
        <button class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600" @click="page = 1; load()">
          <i class="fas fa-search" />
        </button>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">头像</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户名</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">电话</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">注册时间</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="u in items" :key="u.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 text-sm text-gray-500">{{ u.id }}</td>
              <td class="px-6 py-4">
                <img
                  :src="u.avatar_url || 'https://via.placeholder.com/40'"
                  class="w-10 h-10 rounded-full object-cover"
                  :alt="u.name"
                />
              </td>
              <td class="px-6 py-4 text-sm font-medium text-gray-800">{{ u.name }}</td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ u.phone || '-' }}</td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ formatDateTime(u.created_at) }}</td>
              <td class="px-6 py-4">
                <div class="flex gap-2">
                  <button
                    class="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                    @click="viewDetail(u.id)"
                  >
                    <i class="fas fa-eye mr-1" />详情
                  </button>
                  <button
                    class="px-3 py-1.5 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                    @click="openEdit(u)"
                  >
                    <i class="fas fa-edit mr-1" />编辑
                  </button>
                  <button
                    class="px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                    @click="remove(u.id)"
                  >
                    <i class="fas fa-trash mr-1" />删除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!items.length && !loading" class="text-center py-8 text-gray-400">暂无用户</p>
        <div v-if="loading" class="text-center py-8">
          <i class="fas fa-spinner fa-spin text-blue-500 text-xl" />
        </div>
      </div>

      <div v-if="totalPages > 1" class="flex items-center justify-between px-6 py-4 border-t border-gray-100">
        <span class="text-sm text-gray-500">共 {{ total }} 条记录</span>
        <div class="flex gap-1">
          <button :disabled="page <= 1" class="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-40" @click="page--">上一页</button>
          <button
            v-for="p in totalPages"
            :key="p"
            :class="['px-3 py-1 text-sm border rounded', p === page ? 'bg-blue-500 text-white border-blue-500' : 'hover:bg-gray-50']"
            @click="page = p"
          >
            {{ p }}
          </button>
          <button :disabled="page >= totalPages" class="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-40" @click="page++">下一页</button>
        </div>
      </div>
    </div>

    <!-- Detail modal -->
    <div v-if="selected" class="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 overflow-y-auto">
      <div class="bg-white rounded-2xl p-8 w-full max-w-2xl mb-10">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-gray-800">用户详情</h3>
          <button class="text-gray-400 hover:text-gray-600" @click="closeDetail">
            <i class="fas fa-times text-xl" />
          </button>
        </div>

        <div v-if="detailLoading" class="text-center py-8">
          <i class="fas fa-spinner fa-spin text-blue-500 text-xl" />
        </div>

        <template v-else-if="detail">
          <!-- User info -->
          <div class="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
            <img
              :src="detail.user?.avatar_url || 'https://via.placeholder.com/60'"
              class="w-14 h-14 rounded-full object-cover"
            />
            <div>
              <p class="text-lg font-semibold text-gray-800">{{ detail.user?.name }}</p>
              <p class="text-sm text-gray-500">ID: {{ detail.user?.id }} | 电话: {{ detail.user?.phone || '未绑定' }}</p>
              <p class="text-xs text-gray-400">注册: {{ formatDateTime(detail.user?.created_at) }}</p>
            </div>
          </div>

          <!-- Appointments -->
          <div class="mb-6">
            <h4 class="font-semibold text-gray-700 mb-3">
              <i class="fas fa-calendar text-blue-500 mr-2" />预约记录 ({{ detail.appointments?.length || 0 }})
            </h4>
            <div v-if="detail.appointments?.length" class="space-y-2">
              <div
                v-for="a in detail.appointments"
                :key="a.id"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm"
              >
                <div>
                  <span class="font-medium text-gray-800">{{ a.serviceName || '未知服务' }}</span>
                  <span class="text-gray-400 mx-2">|</span>
                  <span class="text-gray-500">{{ a.date }} {{ a.time }}</span>
                </div>
                <span
                  :class="[
                    'px-2 py-0.5 text-xs rounded-full',
                    a.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                    a.status === 'completed' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-600',
                  ]"
                >
                  {{ a.status === 'upcoming' ? '待服务' : a.status === 'completed' ? '已完成' : '已取消' }}
                </span>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400">暂无预约记录</p>
          </div>

          <!-- Likes -->
          <div>
            <h4 class="font-semibold text-gray-700 mb-3">
              <i class="fas fa-heart text-blue-500 mr-2" />点赞作品 ({{ detail.likes?.length || 0 }})
            </h4>
            <div v-if="detail.likes?.length" class="flex flex-wrap gap-2">
              <span
                v-for="(l, i) in detail.likes"
                :key="i"
                class="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm"
              >
                {{ l.title }} ({{ l.category }})
              </span>
            </div>
            <p v-else class="text-sm text-gray-400">暂无点赞</p>
          </div>
        </template>
      </div>
    </div>

    <!-- Edit modal -->
    <div v-if="editing" class="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 overflow-y-auto">
      <div class="bg-white rounded-2xl p-8 w-full max-w-md mb-10">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-gray-800">编辑用户</h3>
          <button class="text-gray-400 hover:text-gray-600" @click="editing = false">
            <i class="fas fa-times text-xl" />
          </button>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <input v-model="form.name" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-blue-400 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">手机号</label>
            <input v-model="form.phone" maxlength="11" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-blue-400 outline-none" />
          </div>
          <ImageCropper v-model="form.avatar_url" label="头像" :enable-crop="true" />
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button class="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200" @click="editing = false">取消</button>
          <button class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600" @click="save">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>
