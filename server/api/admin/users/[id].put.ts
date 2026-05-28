import { query, queryOne } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { name, phone, avatar_url } = body

  if (!name) {
    throw createError({ statusCode: 400, message: '用户名不能为空' })
  }

  const existing = await queryOne('SELECT id FROM sys_users WHERE id = ?', [id])
  if (!existing) {
    throw createError({ statusCode: 404, message: '用户不存在' })
  }

  await query(
    'UPDATE sys_users SET name=?, phone=?, avatar_url=? WHERE id=?',
    [name, phone || '', avatar_url || '', id]
  )

  return { success: true }
})
