import { query } from '../../../utils/db'

export default defineEventHandler(async () => {
  const items = await query('SELECT * FROM sys_site_content ORDER BY content_group, sort_order')
  return items
})
