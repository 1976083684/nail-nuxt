import { query, queryOne } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const page = Number(q.page) || 1
  const pageSize = Number(q.pageSize) || 12
  const categoryId = q.categoryId as string

  let whereClause = 'WHERE 1=1'
  const whereParams: any[] = []

  if (categoryId && categoryId !== 'all') {
    whereClause += ' AND gi.category_id = ?'
    whereParams.push(categoryId)
  }

  // 统计总数
  const countRow = await queryOne<any>(
    `SELECT COUNT(*) as total FROM nail_gallery_items gi ${whereClause}`,
    whereParams
  )
  const total = countRow?.total || 0

  // 查询列表（关联分类表）
  const offset = (page - 1) * pageSize
  const items = await query(
    `SELECT gi.*, gc.name as category_name
     FROM nail_gallery_items gi
     LEFT JOIN nail_gallery_categories gc ON gi.category_id = gc.id
     ${whereClause}
     ORDER BY gi.sort_order
     LIMIT ${pageSize} OFFSET ${offset}`,
    whereParams
  )

  // 获取点赞数
  for (const item of items as any[]) {
    const likeRow = await queryOne<any>(
      'SELECT COUNT(*) as count FROM nail_gallery_likes WHERE gallery_item_id = ?',
      [item.id]
    )
    item.likeCount = likeRow?.count || 0
  }

  return { items, total, page, pageSize }
})
