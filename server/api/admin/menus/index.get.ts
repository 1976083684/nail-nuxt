import { query } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const admin = event.context.admin
  if (admin?.role !== 'super_admin') {
    throw createError({ statusCode: 403, message: '权限不足' })
  }

  try {
    const rows = await query<any>(
      'SELECT * FROM sys_menus ORDER BY parent_id ASC, sort_order ASC, id ASC'
    )

    // 构建树形结构
    const topLevels = rows.filter(r => !r.parent_id)
    const tree = topLevels.map(parent => ({
      ...parent,
      children: rows.filter(r => r.parent_id === parent.id),
    }))

    return tree
  } catch {
    return []
  }
})
