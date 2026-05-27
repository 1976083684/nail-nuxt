import { query } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { artistId, startDate, endDate, daysOfWeek, reason } = body

  if (!startDate || !endDate) {
    throw createError({ statusCode: 400, message: '缺少日期范围' })
  }

  // 获取目标美甲师列表
  let artistIds: number[] = []
  if (artistId === 'all' || !artistId) {
    const artists = await query<any>('SELECT id FROM nail_artists')
    artistIds = artists.map(a => a.id)
  } else {
    artistIds = [Number(artistId)]
  }

  if (artistIds.length === 0) {
    throw createError({ statusCode: 400, message: '没有找到美甲师' })
  }

  // 生成日期列表
  const dates: string[] = []
  const current = new Date(startDate)
  const end = new Date(endDate)
  while (current <= end) {
    const dayOfWeek = current.getDay()
    // 如果指定了星期几，只处理匹配的日期
    if (!daysOfWeek || daysOfWeek.length === 0 || daysOfWeek.includes(dayOfWeek)) {
      const y = current.getFullYear()
      const m = String(current.getMonth() + 1).padStart(2, '0')
      const d = String(current.getDate()).padStart(2, '0')
      dates.push(`${y}-${m}-${d}`)
    }
    current.setDate(current.getDate() + 1)
  }

  // 批量插入
  let count = 0
  for (const date of dates) {
    for (const aid of artistIds) {
      // 检查是否已有整天休息记录
      const existing = await query(
        'SELECT id FROM nail_artist_schedules WHERE artist_id = ? AND date = ? AND time_slot IS NULL',
        [aid, date]
      )
      if ((existing as any[]).length === 0) {
        await query(
          'INSERT IGNORE INTO nail_artist_schedules (artist_id, date, time_slot, is_unavailable, reason) VALUES (?, ?, NULL, 1, ?)',
          [aid, date, reason || '休息']
        )
        count++
      }
    }
  }

  return { success: true, count }
})
