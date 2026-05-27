export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const year = Number(query.year) || new Date().getFullYear()

  try {
    // 使用第三方节假日API获取中国节假日数据
    const data = await $fetch<any>(`https://timor.tech/api/holiday/year/${year}`, {
      timeout: 5000,
    })

    if (!data || !data.holiday) {
      throw new Error('API返回数据格式错误')
    }

    // 处理节假日数据
    const holidays: Record<string, { name: string; isWorkday: boolean }> = {}

    for (const [dateStr, info] of Object.entries(data.holiday as Record<string, any>)) {
      // dateStr 格式: "2024-01-01"
      holidays[dateStr] = {
        name: info.name || '',
        isWorkday: info.after === true || info.after === 1, // after表示补班日
      }
    }

    return {
      year,
      holidays,
    }
  } catch (e) {
    // 如果API获取失败，返回预设的节假日数据（主要节日）
    console.warn('获取节假日API失败，使用预设数据:', (e as Error).message)

    const holidays: Record<string, { name: string; isWorkday: boolean }> = {}

    // 预设主要节假日（根据年份动态计算）
    const presetHolidays = getPresetHolidays(year)
    for (const h of presetHolidays) {
      holidays[h.date] = { name: h.name, isWorkday: h.isWorkday }
    }

    return { year, holidays }
  }
})

// 预设节假日计算（基于农历的节日需要每年更新）
function getPresetHolidays(year: number) {
  // 固定节假日（公历）
  const fixedHolidays = [
    { month: 1, day: 1, name: '元旦' },
    { month: 5, day: 1, name: '劳动节' },
    { month: 10, day: 1, name: '国庆节' },
    { month: 10, day: 2, name: '国庆节' },
    { month: 10, day: 3, name: '国庆节' },
  ]

  const result: Array<{ date: string; name: string; isWorkday: boolean }> = []

  // 添加固定节假日
  for (const h of fixedHolidays) {
    const dateStr = `${year}-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`
    result.push({ date: dateStr, name: h.name, isWorkday: false })
  }

  // 注意：春节、清明、端午、中秋等农历节日需要每年手动更新或使用更复杂的计算
  // 这里只提供基础框架，实际使用时建议调用可靠的节假日API

  // 示例：添加一些常见的补班日（需要根据实际情况调整）
  // 补班日通常是周末但需要上班的日子

  return result
}
