import { query } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  // 先删除该分类下的所有作品
  await query('DELETE FROM nail_gallery_items WHERE category_id = ?', [id])

  // 再删除分类本身
  const result = await query<any>('DELETE FROM nail_gallery_categories WHERE id = ?', [id])

  if (result.affectedRows === 0) {
    throw createError({ statusCode: 404, message: '分类不存在' })
  }

  return { success: true }
})
