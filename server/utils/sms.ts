import { queryOne, query } from './db'

interface SmsConfig {
  id: number
  provider: string
  providerName: string
  accessKey: string
  accessSecret: string
  signName: string
  templateCode: string
  isEnabled: boolean
}

/**
 * 获取短信配置（默认供应商）
 */
export async function getSmsConfig(): Promise<SmsConfig | null> {
  const config = await queryOne<any>(
    'SELECT * FROM sys_sms_config WHERE is_default = 1 LIMIT 1'
  )

  if (!config) return null

  return {
    id: config.id,
    provider: config.provider,
    providerName: config.provider_name,
    accessKey: config.access_key || '',
    accessSecret: config.access_secret || '',
    signName: config.sign_name || '',
    templateCode: config.template_code || '',
    isEnabled: config.is_enabled === 1,
  }
}

/**
 * 获取所有短信配置
 */
export async function getAllSmsConfigs(): Promise<SmsConfig[]> {
  const configs = await query<any>('SELECT * FROM sys_sms_config ORDER BY is_default DESC, id ASC')

  return configs.map(config => ({
    id: config.id,
    provider: config.provider,
    providerName: config.provider_name,
    accessKey: config.access_key || '',
    accessSecret: config.access_secret || '',
    signName: config.sign_name || '',
    templateCode: config.template_code || '',
    isEnabled: config.is_enabled === 1,
  }))
}

/**
 * 更新短信配置
 */
export async function updateSmsConfig(id: number, data: Partial<SmsConfig>): Promise<boolean> {
  const fields: string[] = []
  const values: any[] = []

  if (data.accessKey !== undefined) {
    fields.push('access_key = ?')
    values.push(data.accessKey)
  }
  if (data.accessSecret !== undefined) {
    fields.push('access_secret = ?')
    values.push(data.accessSecret)
  }
  if (data.signName !== undefined) {
    fields.push('sign_name = ?')
    values.push(data.signName)
  }
  if (data.templateCode !== undefined) {
    fields.push('template_code = ?')
    values.push(data.templateCode)
  }
  if (data.isEnabled !== undefined) {
    fields.push('is_enabled = ?')
    values.push(data.isEnabled ? 1 : 0)
  }

  if (fields.length === 0) return false

  values.push(id)
  await query(`UPDATE sys_sms_config SET ${fields.join(', ')} WHERE id = ?`, values)
  return true
}

/**
 * 设置默认供应商
 */
export async function setDefaultSmsProvider(id: number): Promise<boolean> {
  await query('UPDATE sys_sms_config SET is_default = 0')
  await query('UPDATE sys_sms_config SET is_default = 1 WHERE id = ?', [id])
  return true
}

/**
 * 创建阿里云客户端
 */
async function createAliyunClient(accessKeyId: string, accessKeySecret: string) {
  const DypnsapiModule = await import('@alicloud/dypnsapi20170525')
  const OpenApiModule = await import('@alicloud/openapi-client')

  const Config = OpenApiModule.Config || OpenApiModule.default?.Config
  const DypnsapiClient = DypnsapiModule.default || DypnsapiModule

  const apiConfig = new Config({
    accessKeyId,
    accessKeySecret,
  })
  apiConfig.endpoint = 'dypnsapi.aliyuncs.com'

  const Client = DypnsapiClient.default || DypnsapiClient
  return { client: new Client(apiConfig), DypnsapiModule }
}

/**
 * 发送阿里云号码认证短信验证码
 */
async function sendAliyunSms(config: SmsConfig, phone: string): Promise<{ success: boolean; message: string; response?: any }> {
  try {
    const { client, DypnsapiModule } = await createAliyunClient(config.accessKey, config.accessSecret)

    const SendSmsVerifyCodeRequest = DypnsapiModule.SendSmsVerifyCodeRequest

    const request = new SendSmsVerifyCodeRequest({
      phoneNumber: phone,
      signName: config.signName,
      templateCode: config.templateCode,
      templateParam: JSON.stringify({ code: '##code##', min: '5' }),
    })

    const response = await client.sendSmsVerifyCode(request)

    if (response.body?.code === 'OK') {
      return {
        success: true,
        message: '验证码发送成功',
        response: {
          code: response.body.code,
          message: response.body.message,
          success: response.body.success,
          bizId: response.body.model?.bizId,
          requestId: response.body.model?.requestId,
        },
      }
    } else {
      return {
        success: false,
        message: response.body?.message || '发送失败',
        response: {
          code: response.body?.code,
          message: response.body?.message,
          success: response.body?.success,
        },
      }
    }
  } catch (error: any) {
    console.error('[SMS] 阿里云发送失败:', error)
    return {
      success: false,
      message: error.message || '发送失败',
      response: {
        error: error.message,
        code: error.code,
      },
    }
  }
}

/**
 * 校验阿里云短信验证码
 */
export async function checkAliyunSmsCode(phone: string, code: string): Promise<{ success: boolean; message: string }> {
  const config = await getSmsConfig()
  if (!config || !config.isEnabled) {
    return { success: false, message: '短信服务未启用' }
  }

  try {
    const { client, DypnsapiModule } = await createAliyunClient(config.accessKey, config.accessSecret)

    const CheckSmsVerifyCodeRequest = DypnsapiModule.CheckSmsVerifyCodeRequest

    const request = new CheckSmsVerifyCodeRequest({
      phoneNumber: phone,
      verifyCode: code,
    })

    const response = await client.checkSmsVerifyCode(request)

    if (response.body?.code === 'OK') {
      return { success: true, message: '验证码校验成功' }
    } else {
      return { success: false, message: response.body?.message || '验证码错误' }
    }
  } catch (error: any) {
    console.error('[SMS] 阿里云校验失败:', error)
    return { success: false, message: error.message || '校验失败' }
  }
}

/**
 * 生成4位验证码
 */
export function generateSmsCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

/**
 * 发送短信验证码
 */
export async function sendSmsCode(phone: string): Promise<{ success: boolean; message: string; response?: any }> {
  const config = await getSmsConfig()

  if (!config || !config.isEnabled) {
    return { success: false, message: '短信服务未启用' }
  }

  if (!config.accessKey || !config.accessSecret) {
    return { success: false, message: '短信配置不完整，请先配置 AccessKey' }
  }

  switch (config.provider) {
    case 'aliyun':
      return await sendAliyunSms(config, phone)
    default:
      return { success: false, message: `不支持的短信供应商: ${config.provider}` }
  }
}