import { query } from '../../../utils/db'

export default defineEventHandler(async () => {
  const nail_artists = await query('SELECT * FROM nail_artists ORDER BY sort_order')

  for (const art of nail_artists as any[]) {
    art.certifications = await query(
      'SELECT id, certification_name FROM nail_artist_certifications WHERE artist_id = ?',
      [art.id]
    )
    art.works = await query(
      'SELECT id, image_url, description, sort_order FROM nail_artist_works WHERE artist_id = ? ORDER BY sort_order',
      [art.id]
    )
  }

  return nail_artists
})
