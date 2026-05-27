export default defineEventHandler((event) => {
  const admin = event.context.admin
  if (!admin) {
    throw createError({ statusCode: 401, message: '未登录' })
  }
  return admin
})
