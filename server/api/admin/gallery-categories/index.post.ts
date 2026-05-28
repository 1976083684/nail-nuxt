import { query } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.name?.trim()) {
    throw createError({ statusCode: 400, message: '分类名称不能为空' })
  }

  try {
    const result = await query<any>(
      'INSERT INTO nail_gallery_categories (name, sort_order) VALUES (?, ?)',
      [body.name.trim(), body.sort_order || 0]
    )
    return { id: result.insertId, name: body.name.trim(), sort_order: body.sort_order || 0 }
  } catch (e: any) {
    if (e.code === 'ER_DUP_ENTRY') {
      throw createError({ statusCode: 400, message: '分类名称已存在' })
    }
    throw e
  }
})
