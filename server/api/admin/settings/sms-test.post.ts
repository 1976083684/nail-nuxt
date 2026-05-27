import { queryOne } from '../../../utils/db'
import { sendSmsCode } from '../../../utils/sms'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { phone } = body

  if (!phone || !/^1\d{10}$/.test(phone)) {
    throw createError({ statusCode: 400, message: '请输入正确的手机号' })
  }

  // 检查短信是否启用
  const enabled = await queryOne<any>(
    "SELECT setting_value FROM sys_site_settings WHERE setting_key = 'sms_enabled'"
  )
  if (enabled?.setting_value !== 'true') {
    return { success: false, message: '短信服务未启用' }
  }

  // 生成验证码
  const code = Math.floor(100000 + Math.random() * 900000).toString()

  // 发送短信
  const result = await sendSmsCode(phone, code)

  return {
    ...result,
    // 测试模式下返回验证码
    ...(result.success ? { code, message: `发送成功，验证码: ${code}` } : {}),
  }
})
