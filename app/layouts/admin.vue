<script setup lang="ts">
import type { MenuItem } from '~/composables/usePermissions'

const { admin, logout } = useAdmin()
const { loadMenus, hasPermission, getVisibleMenus, menusCache } = usePermissions()
const route = useRoute()
const sidebarOpen = ref(true)
const mobileOpen = ref(false)
const showUserMenu = ref(false)
const showPasswordModal = ref(false)
const pwdForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwdError = ref('')
const pwdLoading = ref(false)
const expandedMenus = ref<Set<number>>(new Set())

// 加载菜单并根据权限过滤
const navItems = computed<MenuItem[]>(() => getVisibleMenus(menusCache.value))

// 自动展开当前路由所在的父菜单
watch(() => route.path, (path) => {
  for (const item of navItems.value) {
    if (item.children?.some(c => path.startsWith(c.route))) {
      expandedMenus.value.add(item.id)
    }
  }
}, { immediate: true })

onMounted(() => {
  loadMenus()
})

function toggleExpand(id: number) {
  if (expandedMenus.value.has(id)) {
    expandedMenus.value.delete(id)
  } else {
    expandedMenus.value.add(id)
  }
}

function isActive(path: string, exact = false) {
  if (exact) return route.path === path
  return route.path === path || route.path.startsWith(path + '/')
}

function isParentActive(item: MenuItem) {
  if (item.route && isActive(item.route, true)) return true
  return false
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

const currentPageTitle = computed(() => {
  for (const item of navItems.value) {
    if (item.children) {
      const child = item.children.find(c => isActive(c.route, true))
      if (child) return child.name
    }
    if (item.route && isActive(item.route, true)) return item.name
  }
  return '管理后台'
})

async function handleLogout() {
  await logout()
}

function openPasswordModal() {
  pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  pwdError.value = ''
  showPasswordModal.value = true
  showUserMenu.value = false
}

async function changePassword() {
  pwdError.value = ''
  if (!pwdForm.value.oldPassword || !pwdForm.value.newPassword) {
    pwdError.value = '请输入旧密码和新密码'
    return
  }
  if (pwdForm.value.newPassword.length < 6) {
    pwdError.value = '新密码长度不能少于6位'
    return
  }
  if (pwdForm.value.newPassword !== pwdForm.value.confirmPassword) {
    pwdError.value = '两次密码输入不一致'
    return
  }
  pwdLoading.value = true
  try {
    await $fetch('/api/admin/change-password', {
      method: 'POST',
      body: { oldPassword: pwdForm.value.oldPassword, newPassword: pwdForm.value.newPassword },
    })
    showPasswordModal.value = false
    alert('密码修改成功')
  } catch (e: any) {
    pwdError.value = e?.data?.message || '修改失败'
  }
  pwdLoading.value = false
}
</script>

<template>
  <div class="admin-layout min-h-screen bg-gray-50">
    <!-- Mobile overlay -->
    <div
      v-if="mobileOpen"
      class="fixed inset-0 bg-black/50 z-40 lg:hidden"
      @click="mobileOpen = false"
    />

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed top-0 left-0 h-full bg-gray-900 text-white z-50 transition-all duration-300 flex flex-col',
        sidebarOpen ? 'w-64' : 'w-20',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      ]"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center px-6 border-b border-gray-800 shrink-0">
        <i class="fas fa-gem text-blue-400 text-xl" />
        <span v-if="sidebarOpen" class="ml-3 text-lg font-semibold tracking-wide">
          LUXE NAIL
        </span>
      </div>

      <!-- Nav items -->
      <nav class="flex-1 py-4 overflow-y-auto">
        <template v-for="item in navItems" :key="item.id">
          <!-- 有子菜单的项目 -->
          <div v-if="item.children && item.children.length > 0">
            <button
              class="w-full flex items-center px-6 py-3 text-sm transition-colors relative text-gray-400 hover:text-white hover:bg-gray-800"
              @click="toggleExpand(item.id)"
            >
              <i :class="item.icon" class="text-lg w-6 text-center" />
              <span v-if="sidebarOpen" class="ml-3 flex-1 text-left">{{ item.name }}</span>
              <i
                v-if="sidebarOpen"
                :class="expandedMenus.has(item.id) ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"
                class="text-xs transition-transform"
              />
            </button>
            <!-- 子菜单 -->
            <transition name="submenu">
              <div v-if="expandedMenus.has(item.id) && sidebarOpen" class="bg-gray-800/50">
                <NuxtLink
                  v-for="child in item.children"
                  :key="child.id"
                  :to="child.route"
                  :class="[
                    'flex items-center pl-14 pr-6 py-2.5 text-sm transition-colors',
                    isActive(child.route, true)
                      ? 'text-blue-400 bg-blue-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800',
                  ]"
                  @click="mobileOpen = false"
                >
                  <i :class="child.icon" class="text-xs w-4 text-center mr-2" />
                  <span>{{ child.name }}</span>
                </NuxtLink>
              </div>
            </transition>
          </div>

          <!-- 普通菜单项 -->
          <NuxtLink
            v-else
            :to="item.route"
            :class="[
              'flex items-center px-6 py-3 text-sm transition-colors relative',
              isActive(item.route, true)
                ? 'bg-blue-500/20 text-blue-400 border-r-2 border-blue-400'
                : 'text-gray-400 hover:text-white hover:bg-gray-800',
            ]"
            @click="mobileOpen = false"
          >
            <i :class="item.icon" class="text-lg w-6 text-center" />
            <span v-if="sidebarOpen" class="ml-3">{{ item.name }}</span>
          </NuxtLink>
        </template>
      </nav>

      <!-- Collapse button (desktop) -->
      <div class="hidden lg:flex items-center justify-center h-12 border-t border-gray-800">
        <button
          class="text-gray-500 hover:text-white transition-colors"
          @click="toggleSidebar"
        >
          <i :class="sidebarOpen ? 'fas fa-chevron-left' : 'fas fa-chevron-right'" />
        </button>
      </div>
    </aside>

    <!-- Main area -->
    <div
      :class="[
        'transition-all duration-300',
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-20',
      ]"
    >
      <!-- Top bar -->
      <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
        <div class="flex items-center gap-4">
          <button class="lg:hidden text-gray-600" @click="mobileOpen = true">
            <i class="fas fa-bars text-xl" />
          </button>
          <button class="hidden lg:block text-gray-600" @click="toggleSidebar">
            <i class="fas fa-bars text-xl" />
          </button>
          <h1 class="text-lg font-semibold text-gray-800">
            {{ currentPageTitle }}
          </h1>
        </div>

        <div class="flex items-center gap-4">
          <NuxtLink to="/" target="_blank" class="text-gray-500 hover:text-blue-500 transition-colors">
            <i class="fas fa-external-link-alt" />
            <span class="hidden sm:inline ml-1 text-sm">访问前台</span>
          </NuxtLink>
          <!-- User dropdown trigger -->
          <div>
            <button
              class="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
              @click="showUserMenu = !showUserMenu"
            >
              <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {{ admin?.name?.[0] || 'A' }}
              </div>
              <span class="hidden sm:inline text-sm text-gray-700">{{ admin?.name }}</span>
              <i class="fas fa-chevron-down text-xs text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      <!-- User dropdown menu (outside header to avoid z-index stacking context) -->
      <div
        v-if="showUserMenu"
        class="fixed right-4 top-14 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-[60]"
        @click.stop
      >
        <div class="px-4 py-2 border-b border-gray-100">
          <p class="text-sm font-medium text-gray-800">{{ admin?.name }}</p>
          <p class="text-xs text-gray-400">{{ admin?.role === 'super_admin' ? '超级管理员' : '管理员' }}</p>
        </div>
        <button
          class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          @click="openPasswordModal"
        >
          <i class="fas fa-key text-gray-400" />修改密码
        </button>
        <button
          class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          @click="handleLogout"
        >
          <i class="fas fa-sign-out-alt text-red-400" />退出登录
        </button>
      </div>

      <main class="p-6">
        <slot />
      </main>
    </div>

    <!-- Password change modal -->
    <Teleport to="body">
      <div v-if="showPasswordModal" class="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center">
        <div class="bg-white rounded-2xl p-8 w-full max-w-md">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-gray-800">修改密码</h3>
            <button class="text-gray-400 hover:text-gray-600" @click="showPasswordModal = false">
              <i class="fas fa-times text-xl" />
            </button>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">旧密码</label>
              <input v-model="pwdForm.oldPassword" type="password" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-blue-400 outline-none" placeholder="请输入旧密码" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">新密码</label>
              <input v-model="pwdForm.newPassword" type="password" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-blue-400 outline-none" placeholder="请输入新密码（至少6位）" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
              <input v-model="pwdForm.confirmPassword" type="password" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-blue-400 outline-none" placeholder="请再次输入新密码" />
            </div>
            <div v-if="pwdError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              <i class="fas fa-exclamation-circle mr-1" />{{ pwdError }}
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button class="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200" @click="showPasswordModal = false">取消</button>
            <button class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50" :disabled="pwdLoading" @click="changePassword">
              <i v-if="pwdLoading" class="fas fa-spinner fa-spin mr-1" />
              {{ pwdLoading ? '修改中...' : '确认修改' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Click outside to close dropdown -->
    <div v-if="showUserMenu" class="fixed inset-0 z-[55]" @click="showUserMenu = false" />

    <!-- Toast 消息提示 -->
    <Toast />
  </div>
</template>

<style scoped>
.submenu-enter-active,
.submenu-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.submenu-enter-from,
.submenu-leave-to {
  opacity: 0;
  max-height: 0;
}
.submenu-enter-to,
.submenu-leave-from {
  opacity: 1;
  max-height: 200px;
}
</style>
