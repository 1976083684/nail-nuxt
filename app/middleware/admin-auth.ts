export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/admin/login') return

  // SSR 时不检查认证（服务端内部请求不携带浏览器 cookie，会误判为未登录）
  if (!import.meta.client) return

  const { admin, fetchAdmin } = useAdmin()
  const { hasPermission, loadMenus } = usePermissions()

  if (!admin.value) {
    const result = await fetchAdmin()
    if (!result) {
      return navigateTo('/admin/login')
    }
  }

  // 确保菜单已加载
  await loadMenus()

  // 从路由路径推导权限 key
  let permKey = to.path === '/admin' ? 'dashboard' : to.path.replace('/admin/', '').replace('/', '.')

  // 检查精确权限，再检查父级权限（如 schedules.create → schedules）
  if (!hasPermission(permKey)) {
    const dotIndex = permKey.indexOf('.')
    if (dotIndex > 0) {
      const parentKey = permKey.substring(0, dotIndex)
      if (!hasPermission(parentKey)) {
        return navigateTo('/admin')
      }
    } else {
      return navigateTo('/admin')
    }
  }
})
