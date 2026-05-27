import { query, queryOne } from '../../utils/db'
import { getCode, deleteCode } from '../../utils/sms-store'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { phone, code } = body

  if (!phone || !/^1\d{10}$/.test(phone)) {
    throw createError({ statusCode: 400, message: '请输入正确的手机号' })
  }

  if (!code) {
    throw createError({ statusCode: 400, message: '请输入验证码' })
  }

  // 验证验证码
  const storedCode = getCode(phone)
  if (!storedCode || storedCode !== code) {
    throw createError({ statusCode: 400, message: '验证码错误或已过期' })
  }

  // 删除已使用的验证码
  deleteCode(phone)

  // 查找或创建用户
  let user = await queryOne<any>(
    'SELECT * FROM sys_users WHERE phone = ?',
    [phone]
  )

  if (!user) {
    // 创建新用户（前台用户），兼容 account_type 字段未添加的情况
    const defaultAvatar = '/default-avatar.jpg'
    let result
    try {
      result = await query(
        "INSERT INTO sys_users (account_type, name, avatar_url, phone) VALUES ('user', ?, ?, ?)",
        [`用户${phone.slice(-4)}`, defaultAvatar, phone]
      )
    } catch {
      result = await query(
        'INSERT INTO sys_users (name, avatar_url, phone) VALUES (?, ?, ?)',
        [`用户${phone.slice(-4)}`, defaultAvatar, phone]
      )
    }
    user = await queryOne<any>(
      'SELECT * FROM sys_users WHERE id = ?',
      [(result as any).insertId]
    )
  }

  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      avatar: user.avatar_url,
      phone: user.phone,
    },
  }
})
