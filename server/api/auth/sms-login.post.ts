import { query, queryOne } from '../../utils/db'
import { checkAliyunSmsCode, getSmsConfig } from '../../utils/sms'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { phone, code } = body

  if (!phone || !/^1\d{10}$/.test(phone)) {
    throw createError({ statusCode: 400, message: '请输入正确的手机号' })
  }

  if (!code) {
    throw createError({ statusCode: 400, message: '请输入验证码' })
  }

  // 获取短信配置
  const config = await getSmsConfig()

  // 检查短信服务是否启用
  if (config && config.isEnabled && config.accessKey && config.accessSecret) {
    // 使用阿里云验证码校验
    const result = await checkAliyunSmsCode(phone, code)
    if (!result.success) {
      throw createError({ statusCode: 400, message: result.message })
    }
  } else {
    // 测试模式：跳过验证码校验（开发环境）
    console.log(`[SMS] 测试模式，跳过验证码校验: ${phone}`)
  }

  // 查找或创建用户
  let user = await queryOne<any>(
    'SELECT * FROM sys_users WHERE phone = ?',
    [phone]
  )

  if (!user) {
    // 创建新用户（前台用户）
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