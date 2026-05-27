import { query } from '../../../../../utils/db'

export default defineEventHandler(async (event) => {
  const admin = event.context.admin
  if (admin?.role !== 'super_admin') {
    throw createError({ statusCode: 403, message: '权限不足' })
  }

  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { menuIds } = body as { menuIds: number[] }

  if (!Array.isArray(menuIds)) {
    throw createError({ statusCode: 400, message: 'menuIds 必须是数组' })
  }

  try {
    // 清除旧权限
    await query('DELETE FROM sys_admin_menus WHERE admin_id = ?', [id])

    // 插入新权限
    if (menuIds.length > 0) {
      const placeholders = menuIds.map(() => '(?, ?)').join(', ')
      const params = menuIds.flatMap(menuId => [id, menuId])
      await query(
        `INSERT INTO sys_admin_menus (admin_id, menu_id) VALUES ${placeholders}`,
        params
      )
    }

    return { success: true }
  } catch {
    throw createError({ statusCode: 500, message: '权限保存失败，请确认数据库已执行 migrate-v3.sql' })
  }
})
