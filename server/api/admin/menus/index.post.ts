import { query, queryOne } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const admin = event.context.admin
  if (admin?.role !== 'super_admin') {
    throw createError({ statusCode: 403, message: '权限不足' })
  }

  const body = await readBody(event)
  const { parent_id, name, perm_key, icon, route, sort_order, is_visible } = body

  if (!name || !perm_key) {
    throw createError({ statusCode: 400, message: '菜单名称和权限标识不能为空' })
  }

  const existing = await queryOne<any>('SELECT id FROM sys_menus WHERE perm_key = ?', [perm_key])
  if (existing) {
    throw createError({ statusCode: 400, message: '权限标识已存在' })
  }

  const result = await query(
    'INSERT INTO sys_menus (parent_id, name, perm_key, icon, route, sort_order, is_visible) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [parent_id || null, name, perm_key, icon || '', route || '', sort_order || 0, is_visible !== false ? 1 : 0]
  )

  return { success: true, id: (result as any).insertId }
})
