<script setup lang="ts">
import type { MenuItem } from '~/composables/usePermissions'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { admin: currentAdmin } = useAdmin()
const items = ref<any[]>([])
const menus = ref<MenuItem[]>([])
const loading = ref(false)
const editing = ref(false)
const editId = ref<number | null>(null)
const form = ref({ username: '', password: '', name: '', role: 'admin' })
const selectedMenuIds = ref<Set<number>>(new Set())
const formError = ref('')

async function load() {
  loading.value = true
  try {
    const [admins, menuData] = await Promise.all([
      $fetch<any[]>('/api/admin/admins'),
      $fetch<MenuItem[]>('/api/admin/menus/all'),
    ])
    items.value = admins || []
    menus.value = menuData || []
  } catch {}
  loading.value = false
}

function openNew() {
  editId.value = null
  form.value = { username: '', password: '', name: '', role: 'admin' }
  selectedMenuIds.value = new Set()
  formError.value = ''
  editing.value = true
}

async function openEdit(item: any) {
  editId.value = item.id
  form.value = {
    username: item.username,
    password: '',
    name: item.name,
    role: item.role,
  }
  formError.value = ''
  editing.value = true

  // 加载该管理员的权限
  if (item.role !== 'super_admin') {
    try {
      const permIds = await $fetch<number[]>(`/api/admin/admins/${item.id}/permissions`)
      selectedMenuIds.value = new Set(permIds || [])
    } catch {
      selectedMenuIds.value = new Set()
    }
  } else {
    selectedMenuIds.value = new Set()
  }
}

function toggleMenu(id: number) {
  if (selectedMenuIds.value.has(id)) {
    selectedMenuIds.value.delete(id)
  } else {
    selectedMenuIds.value.add(id)
  }
}

function isMenuChecked(id: number): boolean {
  if (form.value.role === 'super_admin') return true
  return selectedMenuIds.value.has(id)
}

// 全选/取消全选
const allMenuIds = computed(() => {
  const ids: number[] = []
  for (const menu of menus.value) {
    ids.push(menu.id)
    menu.children?.forEach(c => ids.push(c.id))
  }
  return ids
})

const isAllChecked = computed(() => {
  if (form.value.role === 'super_admin') return true
  return allMenuIds.value.length > 0 && allMenuIds.value.every(id => selectedMenuIds.value.has(id))
})

const isIndeterminate = computed(() => {
  if (form.value.role === 'super_admin') return false
  const checked = allMenuIds.value.filter(id => selectedMenuIds.value.has(id)).length
  return checked > 0 && checked < allMenuIds.value.length
})

function toggleAll() {
  if (isAllChecked.value) {
    selectedMenuIds.value = new Set()
  } else {
    selectedMenuIds.value = new Set(allMenuIds.value)
  }
}

// 父菜单：全选/取消子菜单
function isParentChecked(menu: MenuItem): boolean {
  if (form.value.role === 'super_admin') return true
  return menu.children ? menu.children.every(c => selectedMenuIds.value.has(c.id)) : selectedMenuIds.value.has(menu.id)
}

function isParentIndeterminate(menu: MenuItem): boolean {
  if (form.value.role === 'super_admin' || !menu.children) return false
  const checked = menu.children.filter(c => selectedMenuIds.value.has(c.id)).length
  return checked > 0 && checked < menu.children.length
}

function toggleParent(menu: MenuItem) {
  if (!menu.children?.length) {
    toggleMenu(menu.id)
    return
  }
  const allChecked = isParentChecked(menu)
  if (allChecked) {
    menu.children.forEach(c => selectedMenuIds.value.delete(c.id))
  } else {
    menu.children.forEach(c => selectedMenuIds.value.add(c.id))
  }
}

async function save() {
  formError.value = ''
  if (!form.value.name) { formError.value = '姓名不能为空'; return }
  if (!editId.value && !form.value.username) { formError.value = '用户名不能为空'; return }
  if (!editId.value && !form.value.password) { formError.value = '密码不能为空'; return }
  if (form.value.password && form.value.password.length < 6) { formError.value = '密码长度不能少于6位'; return }

  try {
    if (editId.value) {
      await $fetch(`/api/admin/admins/${editId.value}`, { method: 'PUT', body: form.value })
      // 更新权限（非 super_admin）
      if (form.value.role !== 'super_admin') {
        await $fetch(`/api/admin/admins/${editId.value}/permissions`, {
          method: 'PUT',
          body: { menuIds: Array.from(selectedMenuIds.value) },
        })
      }
    } else {
      const result = await $fetch<any>('/api/admin/admins', { method: 'POST', body: form.value })
      // 新建管理员设置权限
      if (form.value.role !== 'super_admin' && result?.id) {
        await $fetch(`/api/admin/admins/${result.id}/permissions`, {
          method: 'PUT',
          body: { menuIds: Array.from(selectedMenuIds.value) },
        })
      }
    }
    editing.value = false
    load()
  } catch (e: any) {
    formError.value = e?.data?.message || '保存失败'
  }
}

async function remove(id: number) {
  if (!confirm('确定要删除此管理员吗？')) return
  try {
    await $fetch(`/api/admin/admins/${id}`, { method: 'DELETE' })
    load()
  } catch (e: any) {
    alert(e?.data?.message || '删除失败')
  }
}

function roleLabel(role: string) {
  return role === 'super_admin' ? '超级管理员' : '管理员'
}

function isSelf(id: number) {
  return currentAdmin.value?.id === id
}

onMounted(load)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">管理员账号</h2>
      <button class="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm hover:bg-pink-600" @click="openNew">
        <i class="fas fa-plus mr-1" />添加管理员
      </button>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户名</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">最后登录</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="item in items" :key="item.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 text-sm text-gray-500">{{ item.id }}</td>
              <td class="px-6 py-4 text-sm font-medium text-gray-800">
                {{ item.username }}
                <span v-if="isSelf(item.id)" class="ml-1 text-xs text-pink-500">(当前)</span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ item.name }}</td>
              <td class="px-6 py-4">
                <span :class="['px-2 py-1 text-xs rounded-full font-medium', item.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700']">
                  {{ roleLabel(item.role) }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                {{ item.last_login ? formatDateTime(item.last_login) : '从未登录' }}
              </td>
              <td class="px-6 py-4">
                <div class="flex gap-2">
                  <button class="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200" @click="openEdit(item)">
                    <i class="fas fa-edit mr-1" />编辑
                  </button>
                  <button v-if="!isSelf(item.id)" class="px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200" @click="remove(item.id)">
                    <i class="fas fa-trash mr-1" />删除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!items.length && !loading" class="text-center py-8 text-gray-400">暂无管理员</p>
        <div v-if="loading" class="text-center py-8">
          <i class="fas fa-spinner fa-spin text-pink-500 text-xl" />
        </div>
      </div>
    </div>

    <!-- Edit modal -->
    <div v-if="editing" class="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 overflow-y-auto">
      <div class="bg-white rounded-2xl p-8 w-full max-w-lg mb-10">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-gray-800">{{ editId ? '编辑管理员' : '添加管理员' }}</h3>
          <button class="text-gray-400 hover:text-gray-600" @click="editing = false"><i class="fas fa-times text-xl" /></button>
        </div>

        <div class="space-y-4">
          <div v-if="!editId">
            <label class="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <input v-model="form.username" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-pink-400 outline-none" placeholder="登录用户名" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">姓名</label>
            <input v-model="form.name" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-pink-400 outline-none" placeholder="显示名称" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">密码 {{ editId ? '(留空则不修改)' : '' }}</label>
            <input v-model="form.password" type="password" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-pink-400 outline-none" placeholder="登录密码" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">角色</label>
            <select v-model="form.role" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-pink-400 outline-none">
              <option value="admin">管理员</option>
              <option value="super_admin">超级管理员</option>
            </select>
            <p class="text-xs text-gray-400 mt-1">超级管理员拥有所有权限，无需单独配置</p>
          </div>

          <!-- 权限配置（基于数据库菜单） -->
          <div v-if="form.role !== 'super_admin'">
            <label class="block text-sm font-medium text-gray-700 mb-2">菜单权限</label>
            <div class="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
              <!-- 全选 -->
              <div class="flex items-center gap-2 pb-2 mb-2 border-b border-gray-200">
                <input type="checkbox" :checked="isAllChecked" :indeterminate="isIndeterminate" @change="toggleAll" class="w-4 h-4 text-pink-500 rounded" />
                <span class="text-sm font-semibold text-gray-800">全选</span>
              </div>
              <!-- 菜单树 -->
              <div v-for="menu in menus" :key="menu.id" class="mb-3">
                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    :checked="isParentChecked(menu)"
                    :indeterminate="isParentIndeterminate(menu)"
                    @change="toggleParent(menu)"
                    class="w-4 h-4 text-pink-500 rounded"
                  />
                  <i :class="menu.icon" class="text-xs text-gray-400 w-4 text-center" />
                  <span class="text-sm font-medium text-gray-700">{{ menu.name }}</span>
                </div>
                <div v-if="menu.children?.length" class="ml-6 mt-1 space-y-1">
                  <div v-for="child in menu.children" :key="child.id" class="flex items-center gap-2">
                    <input type="checkbox" :checked="isMenuChecked(child.id)" @change="toggleMenu(child.id)" class="w-4 h-4 text-pink-500 rounded" />
                    <i :class="child.icon" class="text-xs text-gray-400 w-4 text-center" />
                    <span class="text-sm text-gray-600">{{ child.name }}</span>
                  </div>
                </div>
              </div>
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
