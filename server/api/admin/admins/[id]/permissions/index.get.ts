import { query } from '../../../../../utils/db'

export default defineEventHandler(async (event) => {
  const admin = event.context.admin
  if (admin?.role !== 'super_admin') {
    throw createError({ statusCode: 403, message: '权限不足' })
  }

  const id = Number(getRouterParam(event, 'id'))

  // 获取该管理员的菜单权限ID列表
  try {
    const rows = await query<any>(
      'SELECT menu_id FROM sys_admin_menus WHERE admin_id = ?',
      [id]
    )
    return rows.map(r => r.menu_id)
  } catch {
    return []
  }
})
