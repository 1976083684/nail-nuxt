import { query } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { image_url, title, category_id } = body

  await query(
    'UPDATE nail_gallery_items SET image_url=?, title=?, category_id=?, sort_order=? WHERE id=?',
    [image_url, title, category_id, body.sort_order || 0, id]
  )

  return { success: true }
})
