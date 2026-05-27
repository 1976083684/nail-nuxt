import { query } from '../../../utils/db'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const admin = event.context.admin
  if (admin?.role !== 'super_admin') {
    throw createError({ statusCode: 403, message: '权限不足' })
  }

  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { name, role, password } = body

  if (!name) {
    throw createError({ statusCode: 400, message: '姓名不能为空' })
  }

  if (password) {
    if (password.length < 6) {
      throw createError({ statusCode: 400, message: '密码长度不能少于6位' })
    }
    const passwordHash = await bcrypt.hash(password, 10)
    await query(
      'UPDATE sys_admins SET name = ?, role = ?, password_hash = ? WHERE id = ?',
      [name, role || 'admin', passwordHash, id]
    )
  } else {
    await query(
      'UPDATE sys_admins SET name = ?, role = ? WHERE id = ?',
      [name, role || 'admin', id]
    )
  }

  return { success: true }
})
