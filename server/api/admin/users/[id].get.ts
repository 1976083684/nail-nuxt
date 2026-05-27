import { query, queryOne } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  const user = await queryOne('SELECT * FROM sys_users WHERE id = ?', [id])
  if (!user) {
    throw createError({ statusCode: 404, message: '用户不存在' })
  }

  const nail_appointments = await query(
    `SELECT a.*, s.name as serviceName, ar.name as artistName
     FROM nail_appointments a
     LEFT JOIN nail_services s ON a.service_id = s.id
     LEFT JOIN nail_artists ar ON a.artist_id = ar.id
     WHERE a.user_id = ?
     ORDER BY a.created_at DESC`,
    [id]
  )

  const likes = await query(
    `SELECT g.title, g.category
     FROM nail_gallery_likes gl
     JOIN nail_gallery_items g ON gl.gallery_item_id = g.id
     WHERE gl.user_id = ?`,
    [id]
  )

  return { user, nail_appointments, likes }
})
