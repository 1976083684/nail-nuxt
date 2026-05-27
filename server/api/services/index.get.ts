import { query } from '../../utils/db'

export default defineEventHandler(async () => {
  const nail_services = await query('SELECT * FROM nail_services ORDER BY sort_order')

  for (const svc of nail_services as any[]) {
    svc.images = await query(
      'SELECT url FROM nail_service_images WHERE service_id = ? ORDER BY sort_order',
      [svc.id]
    ).then(rows => (rows as any[]).map(r => r.url))

    svc.styles = await query(
      'SELECT image_url as img, name, description as `desc` FROM nail_service_styles WHERE service_id = ? ORDER BY sort_order',
      [svc.id]
    )
  }

  return nail_services
})
