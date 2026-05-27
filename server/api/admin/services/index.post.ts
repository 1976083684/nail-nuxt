import { query } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, price, duration, description, detail, icon, images, styles } = body

  if (!name || !price || !duration) {
    throw createError({ statusCode: 400, message: '缺少必要参数' })
  }

  const result = await query<any>(
    'INSERT INTO nail_services (name, price, duration, description, detail, icon) VALUES (?, ?, ?, ?, ?, ?)',
    [name, price, duration, description || '', detail || '', icon || 'fa-sparkles']
  )
  const serviceId = result.insertId

  // 插入图片
  if (images?.length) {
    for (let i = 0; i < images.length; i++) {
      await query(
        'INSERT INTO nail_service_images (service_id, url, sort_order) VALUES (?, ?, ?)',
        [serviceId, images[i], i + 1]
      )
    }
  }

  // 插入样式
  if (styles?.length) {
    for (let i = 0; i < styles.length; i++) {
      await query(
        'INSERT INTO nail_service_styles (service_id, image_url, name, description, sort_order) VALUES (?, ?, ?, ?, ?)',
        [serviceId, styles[i].image_url, styles[i].name, styles[i].description, i + 1]
      )
    }
  }

  return { success: true, id: serviceId }
})
