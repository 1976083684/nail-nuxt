<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const items = ref<any[]>([])
const loading = ref(false)
const editing = ref(false)
const editId = ref<number | null>(null)
const form = ref<any>({
  name: '', title: '', rating: 5, experience_years: 0,
  specialty: '', image_url: '', bio: '',
  certifications: [], works: [],
})

async function load() {
  loading.value = true
  try {
    const data = await $fetch<any[]>('/api/admin/artists')
    items.value = data || []
  } catch {}
  loading.value = false
}

function openNew() {
  editId.value = null
  form.value = { name: '', title: '', rating: 5, experience_years: 0, specialty: '', image_url: '', bio: '', certifications: [], works: [] }
  editing.value = true
}

function openEdit(item: any) {
  editId.value = item.id
  form.value = {
    name: item.name, title: item.title || '', rating: item.rating || 5,
    experience_years: item.experience_years || 0, specialty: item.specialty || '',
    image_url: item.image_url || '', bio: item.bio || '',
    certifications: (item.certifications || []).map((c: any) => c.certification_name),
    works: (item.works || []).map((w: any) => ({ image_url: w.image_url, description: w.description || '' })),
  }
  editing.value = true
}

function addCert() { form.value.certifications.push('') }
function removeCert(i: number) { form.value.certifications.splice(i, 1) }
function addWork() { form.value.works.push({ image_url: '', description: '' }) }
function removeWork(i: number) { form.value.works.splice(i, 1) }

async function save() {
  try {
    if (editId.value) {
      await $fetch(`/api/admin/artists/${editId.value}`, { method: 'PUT', body: form.value })
    } else {
      await $fetch('/api/admin/artists', { method: 'POST', body: form.value })
    }
    editing.value = false
    load()
  } catch (e: any) {
    alert(e?.data?.message || '保存失败')
  }
}

async function remove(id: number) {
  if (!confirm('确定要删除此美甲师吗？')) return
  try {
    await $fetch(`/api/admin/artists/${id}`, { method: 'DELETE' })
    load()
  } catch {}
}

onMounted(load)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">美甲师管理</h2>
      <button class="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm hover:bg-pink-600" @click="openNew">
        <i class="fas fa-plus mr-1" />新增美甲师
      </button>
    </div>

    <div class="grid gap-4">
      <div v-for="item in items" :key="item.id" class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-start justify-between">
        <div class="flex items-start gap-4">
          <img
            :src="item.image_url || 'https://via.placeholder.com/80'"
            class="w-16 h-16 rounded-xl object-cover"
            :alt="item.name"
          />
          <div>
            <h3 class="text-lg font-semibold text-gray-800">{{ item.name }}</h3>
            <p class="text-pink-500 text-sm">{{ item.title }}</p>
            <div class="flex gap-3 text-sm text-gray-500 mt-1">
              <span><i class="fas fa-star text-yellow-400 mr-1" />{{ item.rating }}</span>
              <span>{{ item.experience_years }}年经验</span>
            </div>
            <p v-if="item.specialty" class="text-sm text-gray-400 mt-1">{{ item.specialty }}</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button class="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200" @click="openEdit(item)">
            <i class="fas fa-edit mr-1" />编辑
          </button>
          <button class="px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200" @click="remove(item.id)">
            <i class="fas fa-trash mr-1" />删除
          </button>
        </div>
      </div>
      <p v-if="!items.length && !loading" class="text-center py-8 text-gray-400">暂无美甲师</p>
      <div v-if="loading" class="text-center py-8">
        <i class="fas fa-spinner fa-spin text-pink-500 text-xl" />
      </div>
    </div>

    <!-- Edit modal -->
    <div v-if="editing" class="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 overflow-y-auto">
      <div class="bg-white rounded-2xl p-8 w-full max-w-2xl mb-10">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-gray-800">{{ editId ? '编辑美甲师' : '新增美甲师' }}</h3>
          <button class="text-gray-400 hover:text-gray-600" @click="editing = false">
            <i class="fas fa-times text-xl" />
          </button>
        </div>

        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">姓名</label>
              <input v-model="form.name" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-pink-400 outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">职称</label>
              <input v-model="form.title" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-pink-400 outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">评分</label>
              <input v-model.number="form.rating" type="number" step="0.1" min="0" max="5" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-pink-400 outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">从业年限</label>
              <input v-model.number="form.experience_years" type="number" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-pink-400 outline-none" />
            </div>
          </div>
          <ImageCropper v-model="form.image_url" label="头像" :enable-crop="true" />
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">擅长领域</label>
            <input v-model="form.specialty" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-pink-400 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">简介</label>
            <textarea v-model="form.bio" rows="3" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-pink-400 outline-none" />
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-gray-700">资质证书</label>
              <button class="text-pink-500 text-sm hover:underline" @click="addCert"><i class="fas fa-plus mr-1" />添加</button>
            </div>
            <div v-for="(_, i) in form.certifications" :key="i" class="flex gap-2 mb-2">
              <input v-model="form.certifications[i]" class="flex-1 px-3 py-2 border rounded-lg text-sm focus:border-pink-400 outline-none" placeholder="证书名称" />
              <button class="px-2 text-red-500 hover:text-red-700" @click="removeCert(i)"><i class="fas fa-trash" /></button>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-gray-700">作品图片</label>
              <button class="text-pink-500 text-sm hover:underline" @click="addWork"><i class="fas fa-plus mr-1" />添加</button>
            </div>
            <div v-for="(_, i) in form.works" :key="i" class="mb-3 p-3 border border-gray-100 rounded-lg">
              <div class="flex gap-2">
                <div class="flex-1">
                  <ImageCropper v-model="form.works[i].image_url" :enable-crop="true" />
                </div>
                <button class="px-2 text-red-500 hover:text-red-700 self-start mt-1" @click="removeWork(i)"><i class="fas fa-trash" /></button>
              </div>
              <input v-model="form.works[i].description" class="w-full mt-2 px-3 py-2 border rounded-lg text-sm focus:border-pink-400 outline-none" placeholder="作品描述（选填）" />
            </div>
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
