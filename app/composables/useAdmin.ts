export interface AdminUser {
  id: number
  username: string
  name: string
  role: string
  permissions?: Record<string, boolean> | null
}

export function useAdmin() {
  const admin = useState<AdminUser | null>('adminUser', () => null)
  const loading = ref(false)

  async function fetchAdmin() {
    try {
      const data = await $fetch<AdminUser>('/api/admin/me')
      admin.value = data
      return data
    } catch {
      admin.value = null
      return null
    }
  }

  async function login(username: string, password: string) {
    loading.value = true
    try {
      await $fetch('/api/admin/login', {
        method: 'POST',
        body: { username, password },
      })
      await fetchAdmin()
      return true
    } catch (e: any) {
      throw createError({ statusCode: 401, message: e?.data?.message || '登录失败' })
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    // 尝试服务端清除 cookie
    try { await $fetch('/api/admin/logout', { method: 'POST' }) } catch {}
    // 客户端也强制清除 cookie（防止服务端请求失败时 cookie 残留）
    if (import.meta.client) {
      document.cookie = 'admin_token=; path=/; max-age=0'
      admin.value = null
      window.location.href = '/admin/login'
    } else {
      admin.value = null
      await navigateTo('/admin/login')
    }
  }

  return { admin, loading, fetchAdmin, login, logout }
}
