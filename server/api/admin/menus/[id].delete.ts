import { query } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const admin = event.context.admin
  if (admin?.role !== 'super_admin') {
    throw createError({ statusCode: 403, message: '权限不足' })
  }

  const id = Number(getRouterParam(event, 'id'))

  // 删除子菜单
  await query('DELETE FROM sys_menus WHERE parent_id = ?', [id])
  // 删除关联的权限记录
  await query('DELETE FROM sys_admin_menus WHERE menu_id = ?', [id])
  // 删除菜单本身
  await query('DELETE FROM sys_menus WHERE id = ?', [id])

  return { success: true }
})
