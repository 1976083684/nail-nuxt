import { query } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { name, title, phone, rating, experience_years, specialty, image_url, bio, certifications, works } = body

  await query(
    'UPDATE nail_artists SET name=?, title=?, phone=?, rating=?, experience_years=?, specialty=?, image_url=?, bio=? WHERE id=?',
    [name, title, phone || '', rating || 5.0, experience_years || 0, specialty || '', image_url || '', bio || '', id]
  )

  if (certifications !== undefined) {
    await query('DELETE FROM nail_artist_certifications WHERE artist_id = ?', [id])
    for (const cert of certifications) {
      await query('INSERT INTO nail_artist_certifications (artist_id, certification_name) VALUES (?, ?)', [id, cert])
    }
  }

  if (works !== undefined) {
    await query('DELETE FROM nail_artist_works WHERE artist_id = ?', [id])
    for (let i = 0; i < works.length; i++) {
      const work = typeof works[i] === 'string' ? { image_url: works[i], description: '' } : works[i]
      await query('INSERT INTO nail_artist_works (artist_id, image_url, description, sort_order) VALUES (?, ?, ?, ?)', [id, work.image_url, work.description || '', i + 1])
    }
  }

  return { success: true }
})
