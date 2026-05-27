import { query, queryOne } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const admin = event.context.admin
  if (admin?.role !== 'super_admin') {
    throw createError({ statusCode: 403, message: '权限不足' })
  }

  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { parent_id, name, perm_key, icon, route, sort_order, is_visible } = body

  if (!name || !perm_key) {
    throw createError({ statusCode: 400, message: '菜单名称和权限标识不能为空' })
  }

  const existing = await queryOne<any>('SELECT id FROM sys_menus WHERE perm_key = ? AND id != ?', [perm_key, id])
  if (existing) {
    throw createError({ statusCode: 400, message: '权限标识已存在' })
  }

  await query(
    'UPDATE sys_menus SET parent_id = ?, name = ?, perm_key = ?, icon = ?, route = ?, sort_order = ?, is_visible = ? WHERE id = ?',
    [parent_id || null, name, perm_key, icon || '', route || '', sort_order || 0, is_visible !== false ? 1 : 0, id]
  )

  return { success: true }
})
