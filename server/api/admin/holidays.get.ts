export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const year = Number(query.year) || new Date().getFullYear()

  // 尝试多个节假日 API 源
  const apiSources = [
    `https://timor.tech/api/holiday/year/${year}`,
    `https://api.apihubs.cn/holiday/get?year=${year}`,
  ]

  for (const apiUrl of apiSources) {
    try {
      const data = await $fetch<any>(apiUrl, { timeout: 3000 })

      // 处理 timor.tech 格式
      if (data?.holiday && typeof data.holiday === 'object') {
        const holidays: Record<string, { name: string; isWorkday: boolean }> = {}
        for (const [dateStr, info] of Object.entries(data.holiday as Record<string, any>)) {
          if (info && typeof info === 'object') {
            holidays[dateStr] = {
              name: info.name || '',
              isWorkday: info.after === true || info.after === 1,
            }
          }
        }
        if (Object.keys(holidays).length > 0) {
          return { year, holidays, source: 'api' }
        }
      }
    } catch {
      // 继续尝试下一个 API
    }
  }

  // API 失败，返回空数据
  return { year, holidays: {}, source: 'none' }
})
