<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const items = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(12)
const category = ref('')
const loading = ref(false)
const editing = ref(false)
const editId = ref<number | null>(null)
const form = ref({ image_url: '', title: '', category: '', sort_order: 0 })

const categories = ['全部', '日式花艺', '法式优雅', '艺术彩绘', '凝胶美甲', '3D立体甲', '经典护理']

async function load() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.set('page', String(page.value))
    params.set('pageSize', String(pageSize.value))
    if (category.value && category.value !== '全部') params.set('category', category.value)
    const data = await $fetch<any>(`/api/admin/gallery?${params}`)
    items.value = data.items || []
    total.value = data.total || 0
  } catch {}
  loading.value = false
}

function openNew() {
  editId.value = null
  form.value = { image_url: '', title: '', category: '日式花艺', sort_order: 0 }
  editing.value = true
}

function openEdit(item: any) {
  editId.value = item.id
  form.value = { image_url: item.image_url, title: item.title || '', category: item.category || '', sort_order: item.sort_order || 0 }
  editing.value = true
}

async function save() {
  try {
    if (editId.value) {
      await $fetch(`/api/admin/gallery/${editId.value}`, { method: 'PUT', body: form.value })
    } else {
      await $fetch('/api/admin/gallery', { method: 'POST', body: form.value })
    }
    editing.value = false
    load()
  } catch (e: any) {
    alert(e?.data?.message || '保存失败')
  }
}

async function remove(id: number) {
  if (!confirm('确定要删除此作品吗？')) return
  try {
    await $fetch(`/api/admin/gallery/${id}`, { method: 'DELETE' })
    load()
  } catch {}
}

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

watch([page, category], load)
onMounted(load)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">画廊管理</h2>
      <button class="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm hover:bg-pink-600" @click="openNew">
        <i class="fas fa-plus mr-1" />新增作品
      </button>
    </div>

    <!-- Category filter -->
    <div class="flex flex-wrap gap-2 mb-6">
      <button
        v-for="cat in categories"
        :key="cat"
        :class="[
          'px-3 py-1.5 rounded-full text-sm transition-colors',
          category === cat || (!category && cat === '全部')
            ? 'bg-pink-500 text-white'
            : 'bg-white text-gray-600 border border-gray-200 hover:border-pink-300',
        ]"
        @click="category = cat === '全部' ? '' : cat; page = 1"
      >
        {{ cat }}
      </button>
    </div>

    <!-- Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
      <div
        v-for="item in items"
        :key="item.id"
        class="group relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
      >
        <div class="aspect-square overflow-hidden">
          <img :src="item.image_url" :alt="item.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        </div>
        <div class="p-3">
          <p class="text-sm font-medium text-gray-800 truncate">{{ item.title || '无标题' }}</p>
          <p class="text-xs text-gray-400 mt-1">{{ item.category }}</p>
        </div>
        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button class="px-3 py-1.5 bg-white text-gray-800 rounded-lg text-sm hover:bg-gray-100" @click="openEdit(item)">
            <i class="fas fa-edit" />
          </button>
          <button class="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600" @click="remove(item.id)">
            <i class="fas fa-trash" />
          </button>
        </div>
      </div>
    </div>

    <p v-if="!items.length && !loading" class="text-center py-8 text-gray-400">暂无作品</p>
    <div v-if="loading" class="text-center py-8">
      <i class="fas fa-spinner fa-spin text-pink-500 text-xl" />
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-center gap-1">
      <button :disabled="page <= 1" class="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-40" @click="page--">上一页</button>
      <button
        v-for="p in totalPages"
        :key="p"
        :class="['px-3 py-1 text-sm border rounded', p === page ? 'bg-pink-500 text-white border-pink-500' : 'hover:bg-gray-50']"
        @click="page = p"
      >
        {{ p }}
      </button>
      <button :disabled="page >= totalPages" class="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-40" @click="page++">下一页</button>
    </div>

    <!-- Edit modal -->
    <div v-if="editing" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div class="bg-white rounded-2xl p-8 w-full max-w-md">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-gray-800">{{ editId ? '编辑作品' : '新增作品' }}</h3>
          <button class="text-gray-400 hover:text-gray-600" @click="editing = false">
            <i class="fas fa-times text-xl" />
          </button>
        </div>

        <div class="space-y-4">
          <ImageCropper v-model="form.image_url" label="作品图片" :enable-crop="true" />
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">标题</label>
            <input v-model="form.title" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-pink-400 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">分类</label>
            <select v-model="form.category" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-pink-400 outline-none">
              <option v-for="cat in categories.slice(1)" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">排序</label>
            <input v-model.number="form.sort_order" type="number" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-pink-400 outline-none" />
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button class="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200" @click="editing = false">取消</button>
          <button class="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm hover:bg-pink-600" @click="save">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>
