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

  // 检查精确权限，再检查父级权限
  if (!hasPermission(permKey)) {
    // settings 子页面：如果精确 key 没有，检查父级 settings
    if (permKey.startsWith('settings.')) {
      if (!hasPermission('settings')) {
        return navigateTo('/admin')
      }
    } else {
      return navigateTo('/admin')
    }
  }
})
