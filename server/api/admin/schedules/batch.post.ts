import { query } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { artistId, dates, type, reason } = body

  if (!artistId || !dates || !Array.isArray(dates) || dates.length === 0) {
    throw createError({ statusCode: 400, message: '缺少美甲师或日期' })
  }

  if (!type || !['work', 'off'].includes(type)) {
    throw createError({ statusCode: 400, message: '类型必须为 work 或 off' })
  }

  let count = 0

  if (type === 'work') {
    // 全天上班：删除这些日期的所有不可用记录
    for (const date of dates) {
      const result = await query(
        'DELETE FROM nail_artist_schedules WHERE artist_id = ? AND date = ?',
        [artistId, date]
      )
      count += (result as any).affectedRows || 0
    }
  } else {
    // 全天休息：插入整天不可用记录（跳过已有的）
    for (const date of dates) {
      const existing = await query(
        'SELECT id FROM nail_artist_schedules WHERE artist_id = ? AND date = ? AND time_slot IS NULL',
        [artistId, date]
      )
      if ((existing as any[]).length === 0) {
        await query(
          'INSERT INTO nail_artist_schedules (artist_id, date, time_slot, is_unavailable, reason) VALUES (?, ?, NULL, 1, ?)',
          [artistId, date, reason || '休息']
        )
        count++
      }
    }
  }

  return { success: true, count }
})
