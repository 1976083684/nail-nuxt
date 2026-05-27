import { query } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { image_url, title, category } = body

  if (!image_url || !title || !category) {
    throw createError({ statusCode: 400, message: '缺少必要参数' })
  }

  const result = await query<any>(
    'INSERT INTO nail_gallery_items (image_url, title, category) VALUES (?, ?, ?)',
    [image_url, title, category]
  )

  return { success: true, id: result.insertId }
})
