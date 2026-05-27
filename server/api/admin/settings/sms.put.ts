import { updateSmsConfig, setDefaultSmsProvider } from '../../../utils/sms'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { id, accessKey, accessSecret, signName, templateCode, isEnabled, isDefault } = body

  if (!id) {
    throw createError({ statusCode: 400, message: '缺少配置ID' })
  }

  // 更新配置
  const updateData: any = {}
  if (accessKey !== undefined) updateData.accessKey = accessKey
  if (accessSecret !== undefined) updateData.accessSecret = accessSecret
  if (signName !== undefined) updateData.signName = signName
  if (templateCode !== undefined) updateData.templateCode = templateCode
  if (isEnabled !== undefined) updateData.isEnabled = isEnabled

  await updateSmsConfig(id, updateData)

  // 设置为默认供应商
  if (isDefault) {
    await setDefaultSmsProvider(id)
  }

  return { success: true, message: '配置已更新' }
})