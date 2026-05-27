import { query } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: '缺少排班ID' })
  }

  await query('DELETE FROM nail_artist_schedules WHERE id = ?', [id])
  return { success: true }
})
