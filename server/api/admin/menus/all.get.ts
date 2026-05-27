import { query } from '../../../utils/db'

export default defineEventHandler(async () => {
  // 返回所有可见菜单（供前端侧边栏使用，不需要权限校验）
  try {
    const rows = await query<any>(
      'SELECT id, parent_id, name, perm_key, icon, route, sort_order FROM sys_menus WHERE is_visible = 1 ORDER BY parent_id ASC, sort_order ASC, id ASC'
    )

    // 构建树形结构
    const topLevels = rows.filter(r => !r.parent_id)
    const tree = topLevels.map(parent => ({
      ...parent,
      children: rows.filter(r => r.parent_id === parent.id),
    }))

    return tree
  } catch {
    // sys_menus 表可能不存在，返回空数组
    return []
  }
})
