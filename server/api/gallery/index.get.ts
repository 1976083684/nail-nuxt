import { query, queryOne } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const categoryId = q.categoryId as string || 'all'
  const page = Number(q.page) || 1
  const perPage = Number(q.perPage) || 8
  const userId = q.userId ? Number(q.userId) : null

  let sql = `SELECT gi.*, gc.name as category_name
             FROM nail_gallery_items gi
             LEFT JOIN nail_gallery_categories gc ON gi.category_id = gc.id`
  const params: any[] = []

  if (categoryId && categoryId !== 'all') {
    sql += ' WHERE gi.category_id = ?'
    params.push(categoryId)
  }

  sql += ' ORDER BY gi.sort_order'

  const allItems = await query(sql, params)
  const total = allItems.length
  const start = (page - 1) * perPage
  const items = allItems.slice(start, start + perPage)

  for (const item of items as any[]) {
    const likeRow = await queryOne(
      'SELECT COUNT(*) as count FROM nail_gallery_likes WHERE gallery_item_id = ?',
      [item.id]
    )
    item.likeCount = likeRow ? likeRow.count : 0
    item.liked = false
    if (userId) {
      const userLike = await queryOne(
        'SELECT id FROM nail_gallery_likes WHERE gallery_item_id = ? AND user_id = ?',
        [item.id, userId]
      )
      item.liked = !!userLike
    }
  }

  return { items, total, page, perPage }
})
