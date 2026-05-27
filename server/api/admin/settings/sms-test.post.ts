import { sendSmsCode, getSmsConfig } from '../../../utils/sms'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { phone } = body

  if (!phone || !/^1\d{10}$/.test(phone)) {
    throw createError({ statusCode: 400, message: '请输入正确的手机号' })
  }

  // 获取当前配置
  const config = await getSmsConfig()
  if (!config) {
    throw createError({ statusCode: 400, message: '请先配置短信服务' })
  }

  // 发送短信（验证码由阿里云API自动生成）
  const result = await sendSmsCode(phone)

  return {
    success: result.success,
    message: result.message,
    response: result.response,
    config: {
      provider: config.providerName,
      signName: config.signName,
      templateCode: config.templateCode,
    },
  }
})