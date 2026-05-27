import { query } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { items } = body

  if (!Array.isArray(items)) {
    throw createError({ statusCode: 400, message: '参数格式错误' })
  }

  for (const item of items) {
    await query(
      'UPDATE sys_site_content SET content_value = ? WHERE content_key = ?',
      [item.content_value, item.content_key]
    )
  }

  return { success: true }
})
