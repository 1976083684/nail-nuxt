import { query, queryOne } from '../../../utils/db'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const admin = event.context.admin
  if (admin?.role !== 'super_admin') {
    throw createError({ statusCode: 403, message: '权限不足' })
  }

  const body = await readBody(event)
  const { username, password, name, role } = body

  if (!username || !password || !name) {
    throw createError({ statusCode: 400, message: '用户名、密码、姓名不能为空' })
  }

  if (password.length < 6) {
    throw createError({ statusCode: 400, message: '密码长度不能少于6位' })
  }

  const existing = await queryOne<any>(
    'SELECT id FROM sys_admins WHERE username = ?',
    [username]
  )
  if (existing) {
    throw createError({ statusCode: 400, message: '用户名已存在' })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const result = await query(
    'INSERT INTO sys_admins (username, password_hash, name, role) VALUES (?, ?, ?, ?)',
    [username, passwordHash, name, role || 'admin']
  )

  return { success: true, id: (result as any).insertId }
})
