import { query, queryOne } from '../../utils/db'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const admin = event.context.admin
  if (!admin) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  const body = await readBody(event)
  const { oldPassword, newPassword } = body

  if (!oldPassword || !newPassword) {
    throw createError({ statusCode: 400, message: '请输入旧密码和新密码' })
  }

  if (newPassword.length < 6) {
    throw createError({ statusCode: 400, message: '新密码长度不能少于6位' })
  }

  const user = await queryOne<any>(
    'SELECT password_hash FROM sys_admins WHERE id = ?',
    [admin.id]
  )

  if (!user) {
    throw createError({ statusCode: 404, message: '管理员不存在' })
  }

  const valid = await bcrypt.compare(oldPassword, user.password_hash)
  if (!valid) {
    throw createError({ statusCode: 400, message: '旧密码错误' })
  }

  const newHash = await bcrypt.hash(newPassword, 10)
  await query(
    'UPDATE sys_admins SET password_hash = ? WHERE id = ?',
    [newHash, admin.id]
  )

  return { success: true }
})
