import { query } from '../../utils/db'

export default defineEventHandler(async () => {
  const nail_artists = await query('SELECT * FROM nail_artists ORDER BY sort_order')

  for (const art of nail_artists as any[]) {
    art.certs = await query(
      'SELECT certification_name FROM nail_artist_certifications WHERE artist_id = ?',
      [art.id]
    ).then(rows => (rows as any[]).map(r => r.certification_name))

    art.works = await query(
      'SELECT image_url FROM nail_artist_works WHERE artist_id = ? ORDER BY sort_order',
      [art.id]
    ).then(rows => (rows as any[]).map(r => r.image_url))
  }

  return nail_artists
})
