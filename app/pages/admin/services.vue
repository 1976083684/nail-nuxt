<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const items = ref<any[]>([])
const loading = ref(false)
const editing = ref(false)
const form = ref<any>({ name: '', price: 0, duration: 60, description: '', detail: '', icon: 'fas fa-spa', images: [], styles: [] })
const editId = ref<number | null>(null)
const { showToast } = useToast()

async function load() {
  loading.value = true
  try {
    const data = await $fetch<any[]>('/api/admin/services')
    items.value = data || []
  } catch {}
  loading.value = false
}

function openNew() {
  editId.value = null
  form.value = { name: '', price: 0, duration: 60, description: '', detail: '', icon: 'fas fa-spa', images: [], styles: [] }
  editing.value = true
}

function openEdit(item: any) {
  editId.value = item.id
  form.value = {
    name: item.name,
    price: item.price,
    duration: item.duration,
    description: item.description || '',
    detail: item.detail || '',
    icon: item.icon || 'fas fa-spa',
    images: (item.images || []).map((i: any) => i.url),
    styles: (item.styles || []).map((s: any) => ({ image_url: s.image_url, name: s.name || '', description: s.description || '' })),
  }
  editing.value = true
}

function addImage() { form.value.images.push('') }
function removeImage(i: number) { form.value.images.splice(i, 1) }
function addStyle() { form.value.styles.push({ image_url: '', name: '', description: '' }) }
function removeStyle(i: number) { form.value.styles.splice(i, 1) }

async function save() {
  const body = { ...form.value }
  try {
    if (editId.value) {
      await $fetch(`/api/admin/services/${editId.value}`, { method: 'PUT', body })
    } else {
      await $fetch('/api/admin/services', { method: 'POST', body })
    }
    editing.value = false
    showToast('保存成功', 'success')
    load()
  } catch (e: any) {
    showToast(e?.data?.message || '保存失败', 'error')
  }
}

async function remove(id: number) {
  if (!confirm('确定要删除此服务吗？')) return
  try {
    await $fetch(`/api/admin/services/${id}`, { method: 'DELETE' })
    showToast('删除成功', 'success')
    load()
  } catch (e: any) {
    showToast(e?.data?.message || '删除失败', 'error')
  }
}

onMounted(load)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">服务管理</h2>
      <button class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600" @click="openNew">
        <i class="fas fa-plus mr-1" />新增服务
      </button>
    </div>

    <!-- List -->
    <div class="grid gap-4">
      <div v-for="item in items" :key="item.id" class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">{{ item.name }}</h3>
            <p class="text-gray-500 text-sm mb-2">{{ item.description }}</p>
            <div class="flex gap-4 text-sm text-gray-600">
              <span>¥{{ item.price }}</span>
              <span>{{ item.duration }}分钟</span>
              <span v-if="item.images?.length">{{ item.images.length }}张图片</span>
              <span v-if="item.styles?.length">{{ item.styles.length }}个样式</span>
            </div>
          </div>
          <div class="flex gap-2 ml-4">
            <button class="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200" @click="openEdit(item)">
              <i class="fas fa-edit mr-1" />编辑
            </button>
            <button class="px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200" @click="remove(item.id)">
              <i class="fas fa-trash mr-1" />删除
            </button>
          </div>
        </div>
        <!-- Image preview -->
        <div v-if="item.images?.length" class="flex gap-2 mt-3 overflow-x-auto pb-1">
          <img
            v-for="(img, i) in item.images"
            :key="i"
            :src="img.url"
            class="w-16 h-16 rounded-lg object-cover border border-gray-100 shrink-0"
          />
        </div>
      </div>
      <p v-if="!items.length && !loading" class="text-center py-8 text-gray-400">暂无服务</p>
      <div v-if="loading" class="text-center py-8">
        <i class="fas fa-spinner fa-spin text-blue-500 text-xl" />
      </div>
    </div>

    <!-- Edit modal -->
    <div v-if="editing" class="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 overflow-y-auto">
      <div class="bg-white rounded-2xl p-8 w-full max-w-2xl mb-10">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-gray-800">{{ editId ? '编辑服务' : '新增服务' }}</h3>
          <button class="text-gray-400 hover:text-gray-600" @click="editing = false">
            <i class="fas fa-times text-xl" />
          </button>
        </div>

        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">名称</label>
              <input v-model="form.name" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-blue-400 outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">图标 (Font Awesome)</label>
              <input v-model="form.icon" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-blue-400 outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">价格 (元)</label>
              <input v-model.number="form.price" type="number" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-blue-400 outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">时长 (分钟)</label>
              <input v-model.number="form.duration" type="number" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-blue-400 outline-none" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">简介</label>
            <input v-model="form.description" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-blue-400 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">详情</label>
            <textarea v-model="form.detail" rows="3" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-blue-400 outline-none" />
          </div>

          <!-- Images -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-gray-700">图片列表</label>
              <button class="text-blue-500 text-sm hover:underline" @click="addImage"><i class="fas fa-plus mr-1" />添加</button>
            </div>
            <div v-for="(img, i) in form.images" :key="i" class="mb-3">
              <div class="flex gap-2">
                <div class="flex-1">
                  <ImageCropper v-model="form.images[i]" :enable-crop="true" />
                </div>
                <button class="px-2 text-red-500 hover:text-red-700 self-start mt-1" @click="removeImage(i)"><i class="fas fa-trash" /></button>
              </div>
            </div>
          </div>

          <!-- Styles -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-gray-700">样式参考</label>
              <button class="text-blue-500 text-sm hover:underline" @click="addStyle"><i class="fas fa-plus mr-1" />添加</button>
            </div>
            <div v-for="(s, i) in form.styles" :key="i" class="mb-3 p-3 bg-gray-50 rounded-lg">
              <div class="flex gap-2 mb-2">
                <div class="flex-1">
                  <ImageCropper v-model="s.image_url" :enable-crop="true" />
                </div>
                <button class="px-2 text-red-500 hover:text-red-700 self-start mt-1" @click="removeStyle(i)"><i class="fas fa-trash" /></button>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <input v-model="s.name" class="px-3 py-2 border rounded-lg text-sm focus:border-blue-400 outline-none" placeholder="名称" />
                <input v-model="s.description" class="px-3 py-2 border rounded-lg text-sm focus:border-blue-400 outline-none" placeholder="描述" />
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button class="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200" @click="editing = false">取消</button>
          <button class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600" @click="save">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>
