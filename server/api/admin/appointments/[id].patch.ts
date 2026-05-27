import { query } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { status, artistId } = body

  const updates: string[] = []
  const params: any[] = []

  if (status) {
    updates.push('status = ?')
    params.push(status)
  }
  if (artistId !== undefined) {
    updates.push('artist_id = ?')
    params.push(artistId || null)
  }

  if (updates.length === 0) {
    throw createError({ statusCode: 400, message: '没有需要更新的字段' })
  }

  params.push(id)
  await query(`UPDATE nail_appointments SET ${updates.join(', ')} WHERE id = ?`, params)

  return { success: true }
})
