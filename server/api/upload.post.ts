import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event)
  if (!formData?.length) {
    throw createError({ statusCode: 400, message: '没有上传文件' })
  }

  const file = formData.find(f => f.name === 'file')
  if (!file || !file.filename) {
    throw createError({ statusCode: 400, message: '缺少文件' })
  }

  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  if (file.type && !allowedTypes.includes(file.type)) {
    throw createError({ statusCode: 400, message: '不支持的文件类型，请上传图片' })
  }

  // 验证文件大小 (5MB)
  if (file.data.length > 5 * 1024 * 1024) {
    throw createError({ statusCode: 400, message: '文件大小不能超过5MB' })
  }

  // 生成文件名
  const ext = file.filename.split('.').pop() || 'jpg'
  const date = new Date()
  const dateDir = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  const uploadDir = join(process.cwd(), 'public', 'uploads', dateDir)

  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }

  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const filePath = join(uploadDir, fileName)

  await writeFile(filePath, file.data)

  return {
    url: `/uploads/${dateDir}/${fileName}`,
    name: file.filename,
    size: file.data.length,
  }
})
