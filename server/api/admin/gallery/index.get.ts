import { query, queryOne } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const page = Number(q.page) || 1
  const pageSize = Number(q.pageSize) || 12
  const category = q.category as string

  let whereClause = 'WHERE 1=1'
  const whereParams: any[] = []

  if (category && category !== '全部') {
    whereClause += ' AND category = ?'
    whereParams.push(category)
  }

  // 统计总数
  const countRow = await queryOne<any>(
    `SELECT COUNT(*) as total FROM nail_gallery_items ${whereClause}`,
    whereParams
  )
  const total = countRow?.total || 0

  // 查询列表
  const offset = (page - 1) * pageSize
  const items = await query(
    `SELECT * FROM nail_gallery_items ${whereClause} ORDER BY sort_order LIMIT ${pageSize} OFFSET ${offset}`,
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
