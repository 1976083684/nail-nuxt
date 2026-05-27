import { query } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const admin = event.context.admin
  if (admin?.role !== 'super_admin') {
    throw createError({ statusCode: 403, message: '权限不足' })
  }

  try {
    const sys_admins = await query(
      'SELECT id, username, name, role, last_login, created_at FROM sys_admins ORDER BY created_at DESC'
    )
    return sys_admins
  } catch {
    return []
  }
})
