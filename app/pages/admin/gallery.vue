<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const items = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(12)
const categoryId = ref('all')
const loading = ref(false)
const editing = ref(false)
const editId = ref<number | null>(null)
const form = ref({ image_url: '', title: '', category_id: null as number | null, sort_order: 0 })
const { showToast } = useToast()

// 分类管理
const categories = ref<any[]>([])
const showCategoryModal = ref(false)
const editingCategory = ref(false)
const editCategoryId = ref<number | null>(null)
const categoryForm = ref({ name: '', sort_order: 0 })

// 加载分类
async function loadCategories() {
  try {
    categories.value = await $fetch<any[]>('/api/admin/gallery-categories')
  } catch {}
}

// 打开新增分类弹窗
function openNewCategory() {
  editCategoryId.value = null
  categoryForm.value = { name: '', sort_order: 0 }
  editingCategory.value = true
}

// 打开编辑分类弹窗
function openEditCategory(cat: any) {
  editCategoryId.value = cat.id
  categoryForm.value = { name: cat.name, sort_order: cat.sort_order || 0 }
  editingCategory.value = true
}

// 保存分类
async function saveCategory() {
  try {
    if (editCategoryId.value) {
      await $fetch(`/api/admin/gallery-categories/${editCategoryId.value}`, {
        method: 'PUT',
        body: categoryForm.value
      })
    } else {
      await $fetch('/api/admin/gallery-categories', {
        method: 'POST',
        body: categoryForm.value
      })
    }
    editingCategory.value = false
    showToast('保存成功', 'success')
    loadCategories()
  } catch (e: any) {
    showToast(e?.data?.message || '保存失败', 'error')
  }
}

// 删除分类
async function removeCategory(id: number) {
  if (!confirm('确定要删除此分类吗？该分类下的作品也会一起删除。')) return
  try {
    await $fetch(`/api/admin/gallery-categories/${id}`, { method: 'DELETE' })
    showToast('删除成功', 'success')
    loadCategories()
    load()
  } catch (e: any) {
    showToast(e?.data?.message || '删除失败', 'error')
  }
}

// 加载作品列表
async function load() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.set('page', String(page.value))
    params.set('pageSize', String(pageSize.value))
    if (categoryId.value && categoryId.value !== 'all') params.set('categoryId', categoryId.value)
    const data = await $fetch<any>(`/api/admin/gallery?${params}`)
    items.value = data.items || []
    total.value = data.total || 0
  } catch {}
  loading.value = false
}

function openNew() {
  editId.value = null
  form.value = { image_url: '', title: '', category_id: categories.value[0]?.id || null, sort_order: 0 }
  editing.value = true
}

function openEdit(item: any) {
  editId.value = item.id
  form.value = { image_url: item.image_url, title: item.title || '', category_id: item.category_id, sort_order: item.sort_order || 0 }
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
    showToast('保存成功', 'success')
    load()
  } catch (e: any) {
    showToast(e?.data?.message || '保存失败', 'error')
  }
}

async function remove(id: number) {
  if (!confirm('确定要删除此作品吗？')) return
  try {
    await $fetch(`/api/admin/gallery/${id}`, { method: 'DELETE' })
    showToast('删除成功', 'success')
    load()
  } catch (e: any) {
    showToast(e?.data?.message || '删除失败', 'error')
  }
}

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

watch([page, categoryId], load)
onMounted(() => {
  loadCategories()
  load()
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">画廊管理</h2>
      <div class="flex gap-2">
        <button class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200" @click="showCategoryModal = true">
          <i class="fas fa-tags mr-1" />分类管理
        </button>
        <button class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600" @click="openNew">
          <i class="fas fa-plus mr-1" />新增作品
        </button>
      </div>
    </div>

    <!-- Category filter -->
    <div class="flex flex-wrap gap-2 mb-6">
      <button
        :class="[
          'px-3 py-1.5 rounded-full text-sm transition-colors',
          categoryId === 'all' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300',
        ]"
        @click="categoryId = 'all'; page = 1"
      >
        全部
      </button>
      <button
        v-for="cat in categories"
        :key="cat.id"
        :class="[
          'px-3 py-1.5 rounded-full text-sm transition-colors',
          categoryId === String(cat.id) ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300',
        ]"
        @click="categoryId = String(cat.id); page = 1"
      >
        {{ cat.name }}
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
          <p class="text-xs text-gray-400 mt-1">{{ item.category_name || '未分类' }}</p>
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
      <i class="fas fa-spinner fa-spin text-blue-500 text-xl" />
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-center gap-1">
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
            <input v-model="form.title" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-blue-400 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">分类</label>
            <select v-model="form.category_id" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-blue-400 outline-none">
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">排序</label>
            <input v-model.number="form.sort_order" type="number" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-blue-400 outline-none" />
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button class="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200" @click="editing = false">取消</button>
          <button class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600" @click="save">保存</button>
        </div>
      </div>
    </div>

    <!-- Category management modal -->
    <div v-if="showCategoryModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div class="bg-white rounded-2xl p-8 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-gray-800">分类管理</h3>
          <button class="text-gray-400 hover:text-gray-600" @click="showCategoryModal = false">
            <i class="fas fa-times text-xl" />
          </button>
        </div>

        <div class="mb-4">
          <button class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600" @click="openNewCategory">
            <i class="fas fa-plus mr-1" />新增分类
          </button>
        </div>

        <div class="space-y-2">
          <div
            v-for="cat in categories"
            :key="cat.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
          >
            <div class="flex items-center gap-3">
              <span class="text-sm font-medium text-gray-800">{{ cat.name }}</span>
              <span class="text-xs text-gray-400">排序: {{ cat.sort_order }}</span>
            </div>
            <div class="flex items-center gap-2">
              <button class="px-2 py-1 text-blue-500 hover:bg-blue-50 rounded text-sm" @click="openEditCategory(cat)">
                <i class="fas fa-edit" />
              </button>
              <button class="px-2 py-1 text-red-500 hover:bg-red-50 rounded text-sm" @click="removeCategory(cat.id)">
                <i class="fas fa-trash" />
              </button>
            </div>
          </div>
        </div>

        <p v-if="!categories.length" class="text-center py-4 text-gray-400 text-sm">暂无分类</p>
      </div>
    </div>

    <!-- Category edit modal -->
    <div v-if="editingCategory" class="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
      <div class="bg-white rounded-2xl p-8 w-full max-w-md">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-gray-800">{{ editCategoryId ? '编辑分类' : '新增分类' }}</h3>
          <button class="text-gray-400 hover:text-gray-600" @click="editingCategory = false">
            <i class="fas fa-times text-xl" />
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">分类名称</label>
            <input v-model="categoryForm.name" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-blue-400 outline-none" placeholder="请输入分类名称" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">排序</label>
            <input v-model.number="categoryForm.sort_order" type="number" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-blue-400 outline-none" />
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button class="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200" @click="editingCategory = false">取消</button>
          <button class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600" @click="saveCategory">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>
