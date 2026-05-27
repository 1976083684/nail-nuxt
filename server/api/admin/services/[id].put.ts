import { query } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { name, price, duration, description, detail, icon, images, styles } = body

  await query(
    'UPDATE nail_services SET name=?, price=?, duration=?, description=?, detail=?, icon=? WHERE id=?',
    [name, price, duration, description || '', detail || '', icon || 'fa-sparkles', id]
  )

  // 更新图片：先删后插
  if (images !== undefined) {
    await query('DELETE FROM nail_service_images WHERE service_id = ?', [id])
    for (let i = 0; i < images.length; i++) {
      await query(
        'INSERT INTO nail_service_images (service_id, url, sort_order) VALUES (?, ?, ?)',
        [id, images[i], i + 1]
      )
    }
  }

  // 更新样式：先删后插
  if (styles !== undefined) {
    await query('DELETE FROM nail_service_styles WHERE service_id = ?', [id])
    for (let i = 0; i < styles.length; i++) {
      await query(
        'INSERT INTO nail_service_styles (service_id, image_url, name, description, sort_order) VALUES (?, ?, ?, ?, ?)',
        [id, styles[i].image_url, styles[i].name, styles[i].description, i + 1]
      )
    }
  }

  return { success: true }
})
