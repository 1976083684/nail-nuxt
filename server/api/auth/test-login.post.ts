import { query, queryOne } from '../../utils/db'

export default defineEventHandler(async () => {
  // 查找或创建 test 用户
  let user = await queryOne<any>(
    "SELECT * FROM sys_users WHERE name = 'test' AND account_type = 'user' LIMIT 1"
  )

  if (!user) {
    const result = await query(
      "INSERT INTO sys_users (account_type, name, avatar_url, phone) VALUES ('user', 'test', '/default-avatar.jpg', '13800000000')"
    )
    user = await queryOne<any>(
      'SELECT * FROM sys_users WHERE id = ?',
      [(result as any).insertId]
    )
  }

  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      avatar: user.avatar_url,
      phone: user.phone,
    },
  }
})
