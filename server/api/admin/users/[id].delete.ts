import { query, queryOne } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  const existing = await queryOne('SELECT id FROM sys_users WHERE id = ?', [id])
  if (!existing) {
    throw createError({ statusCode: 404, message: '用户不存在' })
  }

  // 删除关联数据
  await query('DELETE FROM nail_appointments WHERE user_id = ?', [id])
  await query('DELETE FROM nail_gallery_likes WHERE user_id = ?', [id])
  await query('DELETE FROM sys_users WHERE id = ?', [id])

  return { success: true }
})
