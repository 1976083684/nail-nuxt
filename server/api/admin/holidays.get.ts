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

  // 所有 API 失败，使用预设数据
  console.warn(`所有节假日API失败，使用 ${year} 年预设数据`)

  const holidays: Record<string, { name: string; isWorkday: boolean }> = {}
  const presetHolidays = getPresetHolidays(year)
  for (const h of presetHolidays) {
    holidays[h.date] = { name: h.name, isWorkday: h.isWorkday }
  }

  return { year, holidays, source: 'preset' }
})

// 预设节假日数据
function getPresetHolidays(year: number) {
  const result: Array<{ date: string; name: string; isWorkday: boolean }> = []

  // 2026 年节假日数据（根据国务院办公厅通知）
  if (year === 2026) {
    const holidays2026 = [
      // 元旦
      { date: '2026-01-01', name: '元旦', isWorkday: false },
      { date: '2026-01-02', name: '元旦', isWorkday: false },
      { date: '2026-01-03', name: '元旦', isWorkday: false },
      // 春节
      { date: '2026-02-17', name: '春节', isWorkday: false },
      { date: '2026-02-18', name: '春节', isWorkday: false },
      { date: '2026-02-19', name: '春节', isWorkday: false },
      { date: '2026-02-20', name: '春节', isWorkday: false },
      { date: '2026-02-21', name: '春节', isWorkday: false },
      { date: '2026-02-22', name: '春节', isWorkday: false },
      { date: '2026-02-23', name: '春节', isWorkday: false },
      // 清明节
      { date: '2026-04-04', name: '清明节', isWorkday: false },
      { date: '2026-04-05', name: '清明节', isWorkday: false },
      { date: '2026-04-06', name: '清明节', isWorkday: false },
      // 劳动节
      { date: '2026-05-01', name: '劳动节', isWorkday: false },
      { date: '2026-05-02', name: '劳动节', isWorkday: false },
      { date: '2026-05-03', name: '劳动节', isWorkday: false },
      { date: '2026-05-04', name: '劳动节', isWorkday: false },
      { date: '2026-05-05', name: '劳动节', isWorkday: false },
      // 端午节
      { date: '2026-06-19', name: '端午节', isWorkday: false },
      { date: '2026-06-20', name: '端午节', isWorkday: false },
      { date: '2026-06-21', name: '端午节', isWorkday: false },
      // 中秋节
      { date: '2026-09-25', name: '中秋节', isWorkday: false },
      { date: '2026-09-26', name: '中秋节', isWorkday: false },
      { date: '2026-09-27', name: '中秋节', isWorkday: false },
      // 国庆节
      { date: '2026-10-01', name: '国庆节', isWorkday: false },
      { date: '2026-10-02', name: '国庆节', isWorkday: false },
      { date: '2026-10-03', name: '国庆节', isWorkday: false },
      { date: '2026-10-04', name: '国庆节', isWorkday: false },
      { date: '2026-10-05', name: '国庆节', isWorkday: false },
      { date: '2026-10-06', name: '国庆节', isWorkday: false },
      { date: '2026-10-07', name: '国庆节', isWorkday: false },
      // 补班日（周末但需要上班）
      { date: '2026-02-14', name: '春节补班', isWorkday: true },
      { date: '2026-02-28', name: '春节补班', isWorkday: true },
      { date: '2026-04-26', name: '劳动节补班', isWorkday: true },
      { date: '2026-10-10', name: '国庆节补班', isWorkday: true },
    ]
    return holidays2026
  }

  // 2025 年节假日数据
  if (year === 2025) {
    const holidays2025 = [
      // 元旦
      { date: '2025-01-01', name: '元旦', isWorkday: false },
      // 春节
      { date: '2025-01-28', name: '春节', isWorkday: false },
      { date: '2025-01-29', name: '春节', isWorkday: false },
      { date: '2025-01-30', name: '春节', isWorkday: false },
      { date: '2025-01-31', name: '春节', isWorkday: false },
      { date: '2025-02-01', name: '春节', isWorkday: false },
      { date: '2025-02-02', name: '春节', isWorkday: false },
      { date: '2025-02-03', name: '春节', isWorkday: false },
      { date: '2025-02-04', name: '春节', isWorkday: false },
      // 清明节
      { date: '2025-04-04', name: '清明节', isWorkday: false },
      { date: '2025-04-05', name: '清明节', isWorkday: false },
      { date: '2025-04-06', name: '清明节', isWorkday: false },
      // 劳动节
      { date: '2025-05-01', name: '劳动节', isWorkday: false },
      { date: '2025-05-02', name: '劳动节', isWorkday: false },
      { date: '2025-05-03', name: '劳动节', isWorkday: false },
      { date: '2025-05-04', name: '劳动节', isWorkday: false },
      { date: '2025-05-05', name: '劳动节', isWorkday: false },
      // 端午节
      { date: '2025-05-31', name: '端午节', isWorkday: false },
      { date: '2025-06-01', name: '端午节', isWorkday: false },
      { date: '2025-06-02', name: '端午节', isWorkday: false },
      // 中秋节+国庆节
      { date: '2025-10-01', name: '国庆节', isWorkday: false },
      { date: '2025-10-02', name: '国庆节', isWorkday: false },
      { date: '2025-10-03', name: '国庆节', isWorkday: false },
      { date: '2025-10-04', name: '国庆节', isWorkday: false },
      { date: '2025-10-05', name: '国庆节', isWorkday: false },
      { date: '2025-10-06', name: '国庆节', isWorkday: false },
      { date: '2025-10-07', name: '国庆节', isWorkday: false },
      { date: '2025-10-08', name: '国庆节', isWorkday: false },
      // 补班日
      { date: '2025-01-26', name: '春节补班', isWorkday: true },
      { date: '2025-02-08', name: '春节补班', isWorkday: true },
      { date: '2025-04-27', name: '劳动节补班', isWorkday: true },
      { date: '2025-09-28', name: '国庆节补班', isWorkday: true },
      { date: '2025-10-11', name: '国庆节补班', isWorkday: true },
    ]
    return holidays2025
  }

  // 其他年份使用固定节假日
  const fixedHolidays = [
    { month: 1, day: 1, name: '元旦' },
    { month: 5, day: 1, name: '劳动节' },
    { month: 10, day: 1, name: '国庆节' },
    { month: 10, day: 2, name: '国庆节' },
    { month: 10, day: 3, name: '国庆节' },
  ]

  for (const h of fixedHolidays) {
    const dateStr = `${year}-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`
    result.push({ date: dateStr, name: h.name, isWorkday: false })
  }

  return result
}
