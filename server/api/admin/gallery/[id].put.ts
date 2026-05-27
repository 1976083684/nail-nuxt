import { query } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { image_url, title, category } = body

  await query(
    'UPDATE nail_gallery_items SET image_url=?, title=?, category=? WHERE id=?',
    [image_url, title, category, id]
  )

  return { success: true }
})
