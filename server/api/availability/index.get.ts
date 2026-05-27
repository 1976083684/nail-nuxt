import { query } from '../../utils/db'

const TIME_SLOTS: string[] = []
for (let h = 10; h <= 19; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`)
  if (h < 19) TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`)
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const date = q.date as string
  const artistId = q.artistId as string

  if (!date) {
    throw createError({ statusCode: 400, message: '需要日期参数' })
  }

  // 查询已预约的时间段
  let sql = "SELECT time FROM nail_appointments WHERE date = ? AND status = 'upcoming'"
  const params: any[] = [date]

  if (artistId && artistId !== '0') {
    sql += ' AND artist_id = ?'
    params.push(artistId)
  }

  const booked = await query(sql, params)
  const bookedSet = new Set((booked as any[]).map(r => r.time))

  return TIME_SLOTS.map(t => ({
    time: t,
    available: !bookedSet.has(t),
  }))
})
