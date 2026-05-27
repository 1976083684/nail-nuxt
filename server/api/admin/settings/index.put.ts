import { query } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const settings = body.settings as Array<{ setting_key: string; setting_value: string }>

  if (!settings?.length) {
    throw createError({ statusCode: 400, message: '没有需要更新的配置' })
  }

  for (const item of settings) {
    await query(
      `INSERT INTO sys_site_settings (setting_key, setting_value, description)
       VALUES (?, ?, '')
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [item.setting_key, item.setting_value]
    )
  }

  return { success: true }
})
