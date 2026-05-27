import { query } from '../../../utils/db'
import { formatDateOnly } from '../../../utils/format'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const page = Number(q.page) || 1
  const pageSize = Number(q.pageSize) || 10
  const status = q.status as string
  const date = q.date as string
  const keyword = q.keyword as string

  let sql = `
    SELECT a.*,
      s.name as serviceName, s.price as servicePrice,
      ar.name as artistName
    FROM nail_appointments a
    LEFT JOIN nail_services s ON a.service_id = s.id
    LEFT JOIN nail_artists ar ON a.artist_id = ar.id
    WHERE 1=1
  `
  const params: any[] = []

  if (status && status !== 'all') {
    sql += ' AND a.status = ?'
    params.push(status)
  }

  if (date) {
    sql += ' AND a.date = ?'
    params.push(date)
  }

  if (keyword) {
    sql += ' AND (a.customer_name LIKE ? OR a.customer_phone LIKE ?)'
    params.push(`%${keyword}%`, `%${keyword}%`)
  }

  // 统计总数
  const countSql = sql.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM')
  const countRow = await query<any>(countSql, params)
  const total = countRow[0]?.total || 0

  // 查询列表
  const offset = (page - 1) * pageSize
  sql += ` ORDER BY a.created_at DESC LIMIT ${pageSize} OFFSET ${offset}`

  const itemsRaw = await query(sql, params)

  // 格式化日期
  const items = itemsRaw.map(item => ({
    ...item,
    date: formatDateOnly(item.date),
  }))

  return { items, total, page, pageSize }
})
