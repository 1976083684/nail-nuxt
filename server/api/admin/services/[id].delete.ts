import { query } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  // 外键 CASCADE 会自动删除关联的 images 和 styles
  await query('DELETE FROM nail_services WHERE id = ?', [id])
  return { success: true }
})
