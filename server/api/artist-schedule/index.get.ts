import { query } from '../../utils/db'
import { getSettings } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const artistId = q.artistId as string
  const startDate = q.startDate as string
  const endDate = q.endDate as string

  if (!artistId || !startDate || !endDate) {
    throw createError({ statusCode: 400, message: '缺少必要参数' })
  }

  // 读取站点配置（时间段范围）
  const settings = await getSettings()
  const businessStart = settings.business_hours_start || '10:00'
  const businessEnd = settings.business_hours_end || '19:00'
  const slotDuration = Number(settings.slot_duration) || 30

  // 查询该美甲师在指定日期范围内的所有排班记录
  const schedules = await query<any>(
    `SELECT date, time_slot, is_unavailable, reason
     FROM nail_artist_schedules
     WHERE artist_id = ? AND date >= ? AND date <= ?
     ORDER BY date, time_slot`,
    [artistId, startDate, endDate]
  )

  // 按日期分组
  const scheduleMap = new Map<string, {
    hasSchedule: boolean
    fullDayOff: boolean
    fullDayAvailable: boolean
    reason: string
    unavailableSlots: string[]
    availableSlots: string[]
  }>()

  for (const s of schedules) {
    // 处理 MySQL 日期格式（使用本地日期避免时区问题）
    let dateStr: string
    if (s.date instanceof Date) {
      const y = s.date.getFullYear()
      const m = String(s.date.getMonth() + 1).padStart(2, '0')
      const d = String(s.date.getDate()).padStart(2, '0')
      dateStr = `${y}-${m}-${d}`
    } else if (typeof s.date === 'string') {
      dateStr = s.date.split('T')[0]
    } else {
      dateStr = String(s.date)
    }

    if (!scheduleMap.has(dateStr)) {
      scheduleMap.set(dateStr, { hasSchedule: false, fullDayOff: false, fullDayAvailable: false, reason: '', unavailableSlots: [], availableSlots: [] })
    }
    const daySchedule = scheduleMap.get(dateStr)!
    daySchedule.hasSchedule = true

    if (s.time_slot === null || s.time_slot === '') {
      // 整天的记录
      if (s.is_unavailable === 1) {
        daySchedule.fullDayOff = true
        daySchedule.reason = s.reason || '休息'
      } else {
        daySchedule.fullDayAvailable = true
      }
    } else {
      // 特定时间段的记录
      if (s.is_unavailable === 1) {
        daySchedule.unavailableSlots.push(s.time_slot)
      } else {
        daySchedule.availableSlots.push(s.time_slot)
      }
    }
  }

  // 生成时间段列表
  const timeSlots: string[] = []
  const [startH, startM] = businessStart.split(':').map(Number)
  const [endH, endM] = businessEnd.split(':').map(Number)
  let current = startH * 60 + startM
  const end = endH * 60 + endM

  while (current < end) {
    const h = Math.floor(current / 60).toString().padStart(2, '0')
    const m = (current % 60).toString().padStart(2, '0')
    timeSlots.push(`${h}:${m}`)
    current += slotDuration
  }

  // 计算每个日期的可用时间段数
  const result: Record<string, { available: boolean; availableSlots: number; totalSlots: number; reason: string }> = {}

  // 获取指定日期范围内的所有日期（使用本地日期避免时区问题）
  const [sy, sm, sd] = startDate.split('-').map(Number)
  const [ey, em, ed] = endDate.split('-').map(Number)
  const rangeStart = new Date(sy, sm - 1, sd)
  const rangeEnd = new Date(ey, em - 1, ed)

  for (let d = new Date(rangeStart); d <= rangeEnd; d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const dateStr = `${y}-${m}-${day}`
    const daySchedule = scheduleMap.get(dateStr)

    if (!daySchedule || !daySchedule.hasSchedule) {
      // 没有排班记录 → 不可预约
      result[dateStr] = { available: false, availableSlots: 0, totalSlots: timeSlots.length, reason: '无排班' }
    } else if (daySchedule.fullDayOff) {
      // 整天休息 → 不可预约
      result[dateStr] = { available: false, availableSlots: 0, totalSlots: timeSlots.length, reason: daySchedule.reason }
    } else if (daySchedule.fullDayAvailable) {
      // 整天可用 → 全部可预约
      result[dateStr] = { available: true, availableSlots: timeSlots.length, totalSlots: timeSlots.length, reason: '' }
    } else {
      // 有部分时间段排班
      const availableCount = daySchedule.availableSlots.length
      const unavailableCount = daySchedule.unavailableSlots.length

      if (availableCount > 0) {
        // 有可用时间段
        result[dateStr] = {
          available: true,
          availableSlots: availableCount,
          totalSlots: timeSlots.length,
          reason: unavailableCount > 0 ? `${unavailableCount}个时段不可用` : ''
        }
      } else if (unavailableCount > 0) {
        // 只有不可用时间段
        result[dateStr] = {
          available: false,
          availableSlots: 0,
          totalSlots: timeSlots.length,
          reason: `${unavailableCount}个时段不可用`
        }
      } else {
        // 没有具体时间段记录，但有排班标记 → 默认可预约
        result[dateStr] = { available: true, availableSlots: timeSlots.length, totalSlots: timeSlots.length, reason: '' }
      }
    }
  }

  return {
    businessStart,
    businessEnd,
    slotDuration,
    timeSlots,
    schedules: result
  }
})
