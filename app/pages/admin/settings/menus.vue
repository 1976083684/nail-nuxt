<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

interface MenuRow {
  id: number
  parent_id: number | null
  name: string
  perm_key: string
  icon: string
  route: string
  sort_order: number
  is_visible: number
  children?: MenuRow[]
}

const items = ref<MenuRow[]>([])
const flatItems = ref<any[]>([])
const loading = ref(false)
const editing = ref(false)
const editId = ref<number | null>(null)
const form = ref({ parent_id: null as number | null, name: '', perm_key: '', icon: '', route: '', sort_order: 0, is_visible: true })
const formError = ref('')
const expandedIds = ref<Set<number>>(new Set())

async function load() {
  loading.value = true
  try {
    const data = await $fetch<any[]>('/api/admin/menus')
    items.value = data || []
    // 构建扁平列表用于父菜单选择
    flatItems.value = []
    for (const item of items.value) {
      flatItems.value.push({ id: item.id, name: item.name, level: 0 })
      if (item.children) {
        for (const child of item.children) {
          flatItems.value.push({ id: child.id, name: child.name, level: 1, parentId: item.id })
        }
      }
    }
    // 默认展开所有一级菜单
    for (const item of items.value) {
      if (item.children?.length) {
        expandedIds.value.add(item.id)
      }
    }
  } catch {}
  loading.value = false
}

function toggleExpand(id: number) {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id)
  } else {
    expandedIds.value.add(id)
  }
}

function openNew(parentId?: number) {
  editId.value = null
  form.value = { parent_id: parentId || null, name: '', perm_key: '', icon: '', route: '', sort_order: 0, is_visible: true }
  formError.value = ''
  editing.value = true
}

function openEdit(item: MenuRow) {
  editId.value = item.id
  form.value = {
    parent_id: item.parent_id,
    name: item.name,
    perm_key: item.perm_key,
    icon: item.icon,
    route: item.route,
    sort_order: item.sort_order,
    is_visible: !!item.is_visible,
  }
  formError.value = ''
  editing.value = true
}

async function save() {
  formError.value = ''
  if (!form.value.name) { formError.value = '菜单名称不能为空'; return }
  if (!form.value.perm_key) { formError.value = '权限标识不能为空'; return }

  try {
    const body = { ...form.value, is_visible: form.value.is_visible ? 1 : 0 }
    if (editId.value) {
      await $fetch(`/api/admin/menus/${editId.value}`, { method: 'PUT', body })
    } else {
      await $fetch('/api/admin/menus', { method: 'POST', body })
    }
    editing.value = false
    load()
  } catch (e: any) {
    formError.value = e?.data?.message || '保存失败'
  }
}

async function remove(id: number) {
  if (!confirm('确定要删除此菜单吗？子菜单也会一并删除。')) return
  try {
    await $fetch(`/api/admin/menus/${id}`, { method: 'DELETE' })
    load()
  } catch (e: any) {
    alert(e?.data?.message || '删除失败')
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">菜单管理</h2>
      <button class="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm hover:bg-pink-600" @click="openNew()">
        <i class="fas fa-plus mr-1" />添加菜单
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <i class="fas fa-spinner fa-spin text-pink-500 text-2xl" />
    </div>

    <!-- Empty -->
    <div v-else-if="!items.length" class="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-12 text-gray-400">
      暂无菜单，请点击上方按钮添加
    </div>

    <!-- Collapsible menu list -->
    <div v-else class="space-y-3">
      <div v-for="item in items" :key="item.id" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <!-- 一级菜单行 -->
        <div class="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors">
          <!-- 折叠按钮 -->
          <button
            v-if="item.children?.length"
            class="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 mr-2 transition-transform"
            :class="expandedIds.has(item.id) ? 'rotate-90' : ''"
            @click="toggleExpand(item.id)"
          >
            <i class="fas fa-chevron-right text-xs" />
          </button>
          <div v-else class="w-6 mr-2" />

          <!-- 图标 -->
          <i :class="item.icon" class="text-gray-400 w-6 text-center text-sm" />

          <!-- 名称 -->
          <span class="ml-3 text-sm font-medium text-gray-800 flex-1">{{ item.name }}</span>

          <!-- 权限标识 -->
          <span class="text-xs text-gray-400 font-mono mr-3">{{ item.perm_key }}</span>

          <!-- 路由 -->
          <span class="text-xs text-gray-400 font-mono mr-3 hidden md:inline">{{ item.route }}</span>

          <!-- 可见状态 -->
          <span class="mr-3">
            <i :class="item.is_visible ? 'fas fa-eye text-green-500' : 'fas fa-eye-slash text-gray-300'" class="text-xs" />
          </span>

          <!-- 子菜单数量 -->
          <span v-if="item.children?.length" class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full mr-3">
            {{ item.children.length }} 个子菜单
          </span>

          <!-- 操作按钮 -->
          <div class="flex gap-1.5">
            <button
              class="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
              title="添加子菜单"
              @click="openNew(item.id)"
            >
              <i class="fas fa-plus text-xs" />
            </button>
            <button
              class="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="编辑"
              @click="openEdit(item)"
            >
              <i class="fas fa-edit text-xs" />
            </button>
            <button
              class="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
              title="删除"
              @click="remove(item.id)"
            >
              <i class="fas fa-trash text-xs" />
            </button>
          </div>
        </div>

        <!-- 子菜单（可折叠） -->
        <div v-if="expandedIds.has(item.id) && item.children?.length" class="border-t border-gray-100">
          <div
            v-for="child in item.children"
            :key="child.id"
            class="flex items-center px-4 py-2.5 pl-16 bg-gray-50/50 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
          >
            <!-- 图标 -->
            <i :class="child.icon" class="text-gray-300 w-5 text-center text-xs" />

            <!-- 名称 -->
            <span class="ml-3 text-sm text-gray-600 flex-1">{{ child.name }}</span>

            <!-- 权限标识 -->
            <span class="text-xs text-gray-400 font-mono mr-3">{{ child.perm_key }}</span>

            <!-- 路由 -->
            <span class="text-xs text-gray-400 font-mono mr-3 hidden md:inline">{{ child.route }}</span>

            <!-- 可见状态 -->
            <span class="mr-3">
              <i :class="child.is_visible ? 'fas fa-eye text-green-500' : 'fas fa-eye-slash text-gray-300'" class="text-xs" />
            </span>

            <!-- 操作按钮 -->
            <div class="flex gap-1.5">
              <button
                class="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="编辑"
                @click="openEdit(child)"
              >
                <i class="fas fa-edit text-xs" />
              </button>
              <button
                class="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="删除"
                @click="remove(child.id)"
              >
                <i class="fas fa-trash text-xs" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit modal -->
    <div v-if="editing" class="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 overflow-y-auto">
      <div class="bg-white rounded-2xl p-8 w-full max-w-lg mb-10">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-gray-800">{{ editId ? '编辑菜单' : '添加菜单' }}</h3>
          <button class="text-gray-400 hover:text-gray-600" @click="editing = false">
            <i class="fas fa-times text-xl" />
          </button>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">父菜单</label>
            <select v-model="form.parent_id" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-pink-400 outline-none">
              <option :value="null">无（顶级菜单）</option>
              <option v-for="p in flatItems.filter(i => i.level === 0)" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">菜单名称</label>
            <input v-model="form.name" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-pink-400 outline-none" placeholder="如：数据看板" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">权限标识</label>
            <input v-model="form.perm_key" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-pink-400 outline-none font-mono" placeholder="如：dashboard" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">图标</label>
            <input v-model="form.icon" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-pink-400 outline-none font-mono" placeholder="如：fas fa-chart-pie" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">路由路径</label>
            <input v-model="form.route" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-pink-400 outline-none font-mono" placeholder="如：/admin" />
          </div>
          <div class="flex gap-4">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">排序</label>
              <input v-model.number="form.sort_order" type="number" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-pink-400 outline-none" />
            </div>
            <div class="flex items-end pb-1">
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.is_visible" type="checkbox" class="w-4 h-4 text-pink-500 rounded" />
                <span class="text-sm text-gray-700">可见</span>
              </label>
            </div>
          </div>
          <div v-if="formError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            <i class="fas fa-exclamation-circle mr-1" />{{ formError }}
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
