import { query } from '../../../utils/db'

export default defineEventHandler(async () => {
  const nail_services = await query('SELECT * FROM nail_services ORDER BY sort_order')

  for (const svc of nail_services as any[]) {
    svc.images = await query(
      'SELECT id, url, sort_order FROM nail_service_images WHERE service_id = ? ORDER BY sort_order',
      [svc.id]
    )
    svc.styles = await query(
      'SELECT id, image_url, name, description, sort_order FROM nail_service_styles WHERE service_id = ? ORDER BY sort_order',
      [svc.id]
    )
  }

  return nail_services
})
