import { sendSmsCode, generateSmsCode, getSmsConfig } from '../../utils/sms'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { phone } = body

  if (!phone || !/^1\d{10}$/.test(phone)) {
    throw createError({ statusCode: 400, message: '请输入正确的手机号' })
  }

  // 获取短信配置
  const config = await getSmsConfig()

  // 检查短信服务是否启用
  if (config && config.isEnabled && config.accessKey && config.accessSecret) {
    // 实际发送短信（验证码由阿里云API自动生成）
    const result = await sendSmsCode(phone)
    if (!result.success) {
      throw createError({ statusCode: 500, message: result.message })
    }
    return { success: true, message: '验证码已发送' }
  } else {
    // 未启用短信时，控制台输出验证码（测试模式）
    const code = generateSmsCode()
    console.log(`[SMS] 测试模式，验证码: ${phone} -> ${code}`)
    return {
      success: true,
      message: '测试模式，验证码已打印到控制台',
      code,
    }
  }
})