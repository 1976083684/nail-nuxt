import bcrypt from 'bcryptjs'
import { queryOne, query } from '../../utils/db'
import { signToken } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body

  if (!username || !password) {
    throw createError({ statusCode: 400, message: '请输入用户名和密码' })
  }

  // 从 sys_admins 表查询管理账号
  const admin = await queryOne<any>(
    'SELECT id, username, password_hash, name, role FROM sys_admins WHERE username = ?',
    [username]
  )

  if (!admin) {
    throw createError({ statusCode: 401, message: '用户名或密码错误' })
  }

  // 验证密码
  const valid = await bcrypt.compare(password, admin.password_hash)
  if (!valid) {
    throw createError({ statusCode: 401, message: '用户名或密码错误' })
  }

  // 更新最后登录时间
  await query('UPDATE sys_admins SET last_login = NOW() WHERE id = ?', [admin.id])

  // 从 sys_admin_menus 表加载权限（super_admin 不需要，直接跳过）
  let permissions: Record<string, boolean> | null = null
  if (admin.role !== 'super_admin') {
    try {
      const permRows = await query<any>(
        `SELECT m.perm_key FROM sys_admin_menus am
         JOIN sys_menus m ON am.menu_id = m.id
         WHERE am.admin_id = ?`,
        [admin.id]
      )
      permissions = {}
      for (const row of permRows) {
        permissions[row.perm_key] = true
      }
    } catch {
      // sys_admin_menus/sys_menus 表可能不存在，忽略错误
      permissions = null
    }
  }

  // 签发 JWT
  const token = signToken({
    id: admin.id,
    username: admin.username,
    name: admin.name,
    role: admin.role,
    permissions,
  })

  // 设置 httpOnly cookie
  setCookie(event, 'admin_token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  return {
    success: true,
    admin: {
      id: admin.id,
      username: admin.username,
      name: admin.name,
      role: admin.role,
      permissions,
    },
  }
})
