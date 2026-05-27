import { query } from '../../utils/db'

export default defineEventHandler(async () => {
  const items = await query('SELECT content_key, content_value, content_group FROM sys_site_content ORDER BY content_group, sort_order')

  // 转为 key-value 对象，按分组组织
  const result: Record<string, Record<string, string>> = {}
  for (const item of items as any[]) {
    if (!result[item.content_group]) result[item.content_group] = {}
    result[item.content_group]![item.content_key] = item.content_value
  }
  return result
})
