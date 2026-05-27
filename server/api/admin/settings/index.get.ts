import { query } from '../../../utils/db'

export default defineEventHandler(async () => {
  const settings = await query('SELECT * FROM sys_site_settings ORDER BY id')
  return settings
})
