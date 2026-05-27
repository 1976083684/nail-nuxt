import { query, queryOne } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { userId, serviceId, artistId, date, time, name, phone, note } = body

  if (!userId || !serviceId || !date || !time || !name || !phone) {
    throw createError({ statusCode: 400, message: '缺少必要参数' })
  }

  // 确保用户存在（模拟登录的用户可能不在数据库中）
  let user = await queryOne<any>('SELECT id FROM sys_users WHERE id = ?', [userId])
  if (!user) {
    await query(
      'INSERT INTO sys_users (id, name, phone) VALUES (?, ?, ?)',
      [userId, name, phone]
    )
  }

  const result = await query(
    `INSERT INTO nail_appointments (user_id, service_id, artist_id, date, time, customer_name, customer_phone, note, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'upcoming')`,
    [userId, serviceId, artistId || null, date, time, name, phone, note || '']
  )

  return { success: true, id: (result as any).insertId }
})
