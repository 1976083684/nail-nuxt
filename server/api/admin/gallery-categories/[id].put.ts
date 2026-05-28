import { query } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!body.name?.trim()) {
    throw createError({ statusCode: 400, message: '分类名称不能为空' })
  }

  try {
    await query(
      'UPDATE nail_gallery_categories SET name = ?, sort_order = ? WHERE id = ?',
      [body.name.trim(), body.sort_order || 0, id]
    )
    return { success: true }
  } catch (e: any) {
    if (e.code === 'ER_DUP_ENTRY') {
      throw createError({ statusCode: 400, message: '分类名称已存在' })
    }
    throw e
  }
})
