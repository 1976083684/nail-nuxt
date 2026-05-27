import { queryOne } from '../../utils/db'
import { setCode } from '../../utils/sms-store'
import { sendSmsCode } from '../../utils/sms'

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

  // 生成验证码
  const code = Math.floor(100000 + Math.random() * 900000).toString()

  // 存储验证码
  setCode(phone, code)

  if (enabled?.setting_value === 'true') {
    // 实际发送短信
    const result = await sendSmsCode(phone, code)
    if (!result.success) {
      throw createError({ statusCode: 500, message: result.message })
    }
  } else {
    // 未启用短信时，控制台输出验证码
    console.log(`[SMS] Mock send to ${phone}: ${code}`)
  }

  return {
    success: true,
    // 测试模式下返回验证码
    ...(enabled?.setting_value !== 'true' ? { code, message: '测试模式，验证码已打印到控制台' } : {}),
  }
})
