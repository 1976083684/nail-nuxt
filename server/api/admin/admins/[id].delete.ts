import { query, queryOne } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  // 不能删除自己
  const admin = event.context.admin
  if (admin && admin.id === id) {
    throw createError({ statusCode: 400, message: '不能删除当前登录的管理员' })
  }

  // 检查是否是最后一个超级管理员
  const target = await queryOne<any>('SELECT role, user_id FROM sys_admins WHERE id = ?', [id])
  if (target?.role === 'super_admin') {
    const count = await queryOne<any>(
      "SELECT COUNT(*) as count FROM sys_admins WHERE role = 'super_admin'"
    )
    if (count?.count <= 1) {
      throw createError({ statusCode: 400, message: '不能删除最后一个超级管理员' })
    }
  }

  // 删除关联的 sys_users 记录（兼容 user_id 字段未添加的情况）
  if (target?.user_id) {
    try {
      await query('DELETE FROM sys_users WHERE id = ?', [target.user_id])
    } catch {}
  }

  await query('DELETE FROM sys_admins WHERE id = ?', [id])
  return { success: true }
})
