import { query } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const artistId = q.artistId as string
  const startDate = q.startDate as string
  const endDate = q.endDate as string

  let sql = `
    SELECT s.*, a.name as artist_name
    FROM nail_artist_schedules s
    LEFT JOIN nail_artists a ON s.artist_id = a.id
    WHERE 1=1
  `
  const params: any[] = []

  if (artistId) {
    sql += ' AND s.artist_id = ?'
    params.push(artistId)
  }
  if (startDate) {
    sql += ' AND s.date >= ?'
    params.push(startDate)
  }
  if (endDate) {
    sql += ' AND s.date <= ?'
    params.push(endDate)
  }

  sql += ' ORDER BY s.date, s.time_slot'

  return await query(sql, params)
})
