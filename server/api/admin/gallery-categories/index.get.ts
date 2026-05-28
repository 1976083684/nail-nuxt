import { query } from '../../../utils/db'

export default defineEventHandler(async () => {
  const categories = await query<any>('SELECT * FROM nail_gallery_categories ORDER BY sort_order, id')
  return categories
})
