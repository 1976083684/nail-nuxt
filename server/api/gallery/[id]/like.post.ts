import { query, queryOne } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const userId = body.userId

  if (!userId) {
    throw createError({ statusCode: 400, message: '需要用户ID' })
  }

  const existing = await queryOne(
    'SELECT id FROM nail_gallery_likes WHERE gallery_item_id = ? AND user_id = ?',
    [id, userId]
  )

  if (existing) {
    await query('DELETE FROM nail_gallery_likes WHERE gallery_item_id = ? AND user_id = ?', [id, userId])
  } else {
    await query('INSERT INTO nail_gallery_likes (gallery_item_id, user_id) VALUES (?, ?)', [id, userId])
  }

  const countRow = await queryOne(
    'SELECT COUNT(*) as count FROM nail_gallery_likes WHERE gallery_item_id = ?',
    [id]
  )

  return { liked: !existing, count: countRow ? countRow.count : 0 }
})
