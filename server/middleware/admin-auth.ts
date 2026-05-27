import { verifyToken } from '../utils/jwt'

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname

  // 只拦截 /api/admin/* 路由，排除 /api/admin/login
  if (!path.startsWith('/api/admin/') || path === '/api/admin/login') {
    return
  }

  const token = getCookie(event, 'admin_token')

  if (!token) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  const payload = verifyToken(token)
  if (!payload) {
    throw createError({ statusCode: 401, message: '登录已过期' })
  }

  // 将管理员信息挂载到 event.context
  event.context.admin = payload
})
