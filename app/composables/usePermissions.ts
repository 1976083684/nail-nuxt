export interface MenuItem {
  id: number
  parent_id: number | null
  name: string
  perm_key: string
  icon: string
  route: string
  sort_order: number
  children?: MenuItem[]
}

export function usePermissions() {
  const { admin } = useAdmin()
  const menusCache = useState<MenuItem[]>('menusCache', () => [])

  // 从服务端加载菜单树
  async function loadMenus() {
    if (menusCache.value.length > 0) return menusCache.value
    try {
      const data = await $fetch<MenuItem[]>('/api/admin/menus/all')
      menusCache.value = data || []
    } catch {
      menusCache.value = []
    }
    return menusCache.value
  }

  // 检查是否有某个菜单权限
  function hasPermission(permKey: string): boolean {
    if (!admin.value) return false
    // super_admin 拥有所有权限
    if (admin.value.role === 'super_admin') return true
    // 普通管理员检查 permissions map
    const perms = admin.value.permissions
    if (!perms) return false
    // 精确匹配
    if (perms[permKey] === true) return true
    // 子权限回退到父级（如 schedules.create → schedules）
    const dotIndex = permKey.indexOf('.')
    if (dotIndex > 0) {
      const parentKey = permKey.substring(0, dotIndex)
      return perms[parentKey] === true
    }
    return false
  }

  // 获取当前管理员可见的菜单树
  function getVisibleMenus(menus: MenuItem[]): MenuItem[] {
    return menus
      .filter(menu => hasPermission(menu.perm_key))
      .map(menu => ({
        ...menu,
        children: menu.children?.filter(child => hasPermission(child.perm_key)),
      }))
  }

  return { menusCache, loadMenus, hasPermission, getVisibleMenus }
}
