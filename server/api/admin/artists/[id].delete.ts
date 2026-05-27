import { query } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  await query('DELETE FROM nail_artists WHERE id = ?', [id])
  return { success: true }
})
