import { query } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const userId = q.userId as string

  if (!userId) {
    throw createError({ statusCode: 400, message: '需要用户ID' })
  }

  const nail_appointments = await query(
    `SELECT a.*,
      s.name as serviceName, s.price as servicePrice, s.duration as serviceDuration,
      ar.name as artistName
    FROM nail_appointments a
    LEFT JOIN nail_services s ON a.service_id = s.id
    LEFT JOIN nail_artists ar ON a.artist_id = ar.id
    WHERE a.user_id = ?
    ORDER BY a.created_at DESC`,
    [userId]
  )

  return nail_appointments
})
