import { queryOne } from './db'

interface SmsConfig {
  provider: string
  accessKey: string
  accessSecret: string
  signName: string
  templateCode: string
}

/**
 * 获取短信配置
 */
async function getSmsConfig(): Promise<SmsConfig> {
  const [provider, accessKey, accessSecret, signName, templateCode] = await Promise.all([
    queryOne<any>("SELECT setting_value FROM sys_site_settings WHERE setting_key = 'sms_provider'"),
    queryOne<any>("SELECT setting_value FROM sys_site_settings WHERE setting_key = 'sms_access_key'"),
    queryOne<any>("SELECT setting_value FROM sys_site_settings WHERE setting_key = 'sms_access_secret'"),
    queryOne<any>("SELECT setting_value FROM sys_site_settings WHERE setting_key = 'sms_sign_name'"),
    queryOne<any>("SELECT setting_value FROM sys_site_settings WHERE setting_key = 'sms_template_code'"),
  ])

  return {
    provider: provider?.setting_value || 'aliyun',
    accessKey: accessKey?.setting_value || '',
    accessSecret: accessSecret?.setting_value || '',
    signName: signName?.setting_value || '',
    templateCode: templateCode?.setting_value || '',
  }
}

/**
 * 发送阿里云短信
 */
async function sendAliyunSms(config: SmsConfig, phone: string, code: string): Promise<boolean> {
  try {
    // 动态导入阿里云 SDK
    const DysmsapiModule = await import('@alicloud/dysmsapi20170525')
    const OpenApiClient = await import('@alicloud/openapi-client')

    const Dysmsapi = DysmsapiModule.default || DysmsapiModule.Dysmsapi
    const Config = OpenApiClient.default || OpenApiClient.Config

    const smsConfig = new Config({
      accessKeyId: config.accessKey,
      accessKeySecret: config.accessSecret,
    })
    smsConfig.endpoint = 'dysmsapi.aliyuncs.com'

    const client = new Dysmsapi(smsConfig)

    const sendSmsRequest = {
      phoneNumbers: phone,
      signName: config.signName,
      templateCode: config.templateCode,
      templateParam: JSON.stringify({ code }),
    }

    const result = await client.sendSms(sendSmsRequest)
    return result.body?.code === 'OK'
  } catch (error) {
    console.error('[SMS] 阿里云发送失败:', error)
    return false
  }
}

/**
 * 发送腾讯云短信
 */
async function sendTencentSms(config: SmsConfig, phone: string, code: string): Promise<boolean> {
  try {
    // 动态导入腾讯云 SDK
    const tencentcloud = await import('tencentcloud-sdk-nodejs')
    const SmsClient = tencentcloud.default?.sms?.v20210111?.Client || tencentcloud.sms?.v20210111?.Client

    if (!SmsClient) {
      throw new Error('腾讯云 SDK 导入失败')
    }

    const client = new SmsClient({
      credential: {
        secretId: config.accessKey,
        secretKey: config.accessSecret,
      },
      region: 'ap-guangzhou',
    })

    const params = {
      PhoneNumberSet: [`+86${phone}`],
      SmsSdkAppId: config.accessKey,
      SignName: config.signName,
      TemplateId: config.templateCode,
      TemplateParamSet: [code],
    }

    const result = await client.SendSms(params)
    return result.SendStatusSet?.[0]?.Code === 'Ok'
  } catch (error) {
    console.error('[SMS] 腾讯云发送失败:', error)
    return false
  }
}

/**
 * 发送七牛云短信
 */
async function sendQiniuSms(config: SmsConfig, phone: string, code: string): Promise<boolean> {
  try {
    // 七牛云短信 API（需要实现具体的 API 调用）
    // 这里只是示例，实际需要根据七牛云文档实现
    console.log('[SMS] 七牛云发送:', { phone, code })
    return true
  } catch (error) {
    console.error('[SMS] 七牛云发送失败:', error)
    return false
  }
}

/**
 * 发送短信验证码
 */
export async function sendSmsCode(phone: string, code: string): Promise<{ success: boolean; message: string }> {
  const config = await getSmsConfig()

  if (!config.accessKey || !config.accessSecret) {
    return { success: false, message: '短信配置不完整，请先配置 AccessKey' }
  }

  let success = false

  switch (config.provider) {
    case 'aliyun':
      success = await sendAliyunSms(config, phone, code)
      break
    case 'tencent':
      success = await sendTencentSms(config, phone, code)
      break
    case 'qiniu':
      success = await sendQiniuSms(config, phone, code)
      break
    default:
      return { success: false, message: `不支持的短信供应商: ${config.provider}` }
  }

  return {
    success,
    message: success ? '短信发送成功' : '短信发送失败，请检查配置',
  }
}