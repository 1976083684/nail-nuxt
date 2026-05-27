import { query, queryOne } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { artistId, date, timeSlot, reason } = body

  if (!artistId || !date) {
    throw createError({ statusCode: 400, message: '缺少美甲师或日期' })
  }

  const slot = timeSlot || null

  // 如果是整天休息（slot=null），先检查是否已有整天记录
  if (!slot) {
    const existing = await queryOne(
      'SELECT id FROM nail_artist_schedules WHERE artist_id = ? AND date = ? AND time_slot IS NULL',
      [artistId, date]
    )
    if (existing) {
      // 更新原因
      await query(
        'UPDATE nail_artist_schedules SET reason = ? WHERE id = ?',
        [reason || '', (existing as any).id]
      )
      return { success: true, id: (existing as any).id }
    }
  }

  // 插入或更新
  const result = await query(
    `INSERT INTO nail_artist_schedules (artist_id, date, time_slot, is_unavailable, reason)
     VALUES (?, ?, ?, 1, ?)
     ON DUPLICATE KEY UPDATE reason = VALUES(reason)`,
    [artistId, date, slot, reason || '']
  )

  return { success: true, id: (result as any).insertId }
})
