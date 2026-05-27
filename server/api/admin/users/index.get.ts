import { query, queryOne } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const page = Number(q.page) || 1
  const pageSize = Number(q.pageSize) || 10
  const keyword = q.keyword as string

  // 只查询前台用户，排除后台管理账号（兼容 account_type 字段未添加的情况）
  let sql = 'SELECT * FROM sys_users WHERE 1=1'
  const params: any[] = []

  if (keyword) {
    sql += ' AND (name LIKE ? OR phone LIKE ?)'
    params.push(`%${keyword}%`, `%${keyword}%`)
  }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total')
  const countRow = await queryOne<any>(countSql, params)
  const total = countRow?.total || 0

  const offset = (page - 1) * pageSize
  sql += ` ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}`

  const items = await query(sql, params)

  return { items, total, page, pageSize }
})
