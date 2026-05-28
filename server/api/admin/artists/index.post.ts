import { query } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, title, phone, rating, experience_years, specialty, image_url, bio, certifications, works } = body

  if (!name || !title) {
    throw createError({ statusCode: 400, message: '缺少必要参数' })
  }

  const result = await query<any>(
    'INSERT INTO nail_artists (name, title, phone, rating, experience_years, specialty, image_url, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [name, title, phone || '', rating || 5.0, experience_years || 0, specialty || '', image_url || '', bio || '']
  )
  const artistId = result.insertId

  if (certifications?.length) {
    for (const cert of certifications) {
      await query(
        'INSERT INTO nail_artist_certifications (artist_id, certification_name) VALUES (?, ?)',
        [artistId, cert]
      )
    }
  }

  if (works?.length) {
    for (let i = 0; i < works.length; i++) {
      const work = typeof works[i] === 'string' ? { image_url: works[i], description: '' } : works[i]
      await query(
        'INSERT INTO nail_artist_works (artist_id, image_url, description, sort_order) VALUES (?, ?, ?, ?)',
        [artistId, work.image_url, work.description || '', i + 1]
      )
    }
  }

  return { success: true, id: artistId }
})
