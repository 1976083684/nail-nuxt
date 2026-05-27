import { query } from '../../utils/db'
import { getSettings } from '../../utils/db'
import { generateTimeSlots, getOccupiedSlots, timeToMinutes } from '../../utils/time-slots'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const date = q.date as string
  const artistId = q.artistId as string
  const serviceId = q.serviceId as string

  if (!date) {
    throw createError({ statusCode: 400, message: '需要日期参数' })
  }

  // 读取站点配置
  const settings = await getSettings()
  const businessStart = settings.business_hours_start || '10:00'
  const businessEnd = settings.business_hours_end || '19:00'
  const slotDuration = Number(settings.slot_duration) || 30

  // 生成时间段
  const timeSlots = generateTimeSlots(businessStart, businessEnd, slotDuration)
  const businessEndMinutes = timeToMinutes(businessEnd)

  // 获取服务时长（如有）
  let serviceDuration = 0
  if (serviceId && serviceId !== '0') {
    const svc = await query<any>('SELECT duration FROM nail_services WHERE id = ?', [serviceId])
    if (svc.length > 0) serviceDuration = svc[0].duration
  }

  // 查询已有预约（含服务时长）
  let appointmentSql = `
    SELECT a.time, COALESCE(s.duration, 30) as duration
    FROM nail_appointments a
    LEFT JOIN nail_services s ON a.service_id = s.id
    WHERE a.date = ? AND a.status = 'upcoming'
  `
  const appointmentParams: any[] = [date]

  const isSpecificArtist = artistId && artistId !== '0'
  if (isSpecificArtist) {
    appointmentSql += ' AND a.artist_id = ?'
    appointmentParams.push(artistId)
  }

  const appointments = await query(appointmentSql, appointmentParams)

  // 计算已有预约占用的时间段集合
  const bookedSlots = new Set<string>()
  for (const appt of appointments) {
    const occupied = getOccupiedSlots(appt.time, appt.duration, slotDuration)
    for (const slot of occupied) bookedSlots.add(slot)
  }

  // 查询排班数据
  let scheduleSql = 'SELECT time_slot, reason FROM nail_artist_schedules WHERE date = ? AND is_unavailable = 1'
  const scheduleParams: any[] = [date]

  if (isSpecificArtist) {
    scheduleSql += ' AND artist_id = ?'
    scheduleParams.push(artistId)
  }

  const schedules = await query(scheduleSql, scheduleParams)

  // 检查是否有整天休息
  const fullDayOff = schedules.some((s: any) => s.time_slot === null || s.time_slot === '')
  // 收集不可用的时间段
  const unavailableSlots = new Set<string>()
  for (const s of schedules) {
    if (s.time_slot) unavailableSlots.add(s.time_slot)
  }

  // 生成可用性结果
  return timeSlots.map(time => {
    // 整天休息
    if (fullDayOff) {
      return { time, available: false }
    }

    // 该时间段被排班标记为不可用
    if (unavailableSlots.has(time)) {
      return { time, available: false }
    }

    // 如果有服务时长，检查服务是否能完整完成（不超营业结束时间）
    if (serviceDuration > 0) {
      const endMinutes = timeToMinutes(time) + serviceDuration
      if (endMinutes > businessEndMinutes) {
        return { time, available: false }
      }

      // 检查服务占用的所有时间段是否与已有预约冲突
      const occupied = getOccupiedSlots(time, serviceDuration, slotDuration)
      for (const slot of occupied) {
        if (bookedSlots.has(slot)) {
          return { time, available: false }
        }
      }
    } else {
      // 无服务时长时，只检查该时间段是否被预约
      if (bookedSlots.has(time)) {
        return { time, available: false }
      }
    }

    return { time, available: true }
  })
})
