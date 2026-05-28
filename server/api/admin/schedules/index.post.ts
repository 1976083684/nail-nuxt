import { query, queryOne } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { artistId, date, timeSlot, reason, isUnavailable } = body

  if (!artistId || !date) {
    throw createError({ statusCode: 400, message: '缺少美甲师或日期' })
  }

  const slot = timeSlot || null
  const unavailable = isUnavailable !== undefined ? (isUnavailable ? 1 : 0) : 1

  // 如果是整天休息（slot=null），先检查是否已有整天记录
  if (!slot) {
    const existing = await queryOne(
      'SELECT id FROM nail_artist_schedules WHERE artist_id = ? AND date = ? AND time_slot IS NULL',
      [artistId, date]
    )
    if (existing) {
      await query(
        'UPDATE nail_artist_schedules SET reason = ?, is_unavailable = ? WHERE id = ?',
        [reason || '', unavailable, (existing as any).id]
      )
      return { success: true, id: (existing as any).id }
    }
  }

  // 插入或更新
  const result = await query(
    `INSERT INTO nail_artist_schedules (artist_id, date, time_slot, is_unavailable, reason)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE is_unavailable = VALUES(is_unavailable), reason = VALUES(reason)`,
    [artistId, date, slot, unavailable, reason || '']
  )

  return { success: true, id: (result as any).insertId }
})
