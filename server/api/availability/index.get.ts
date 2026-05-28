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

  const isSpecificArtist = artistId && artistId !== '0'

  if (isSpecificArtist) {
    // 指定美甲师：检查该美甲师的排班和预约
    return await checkSpecificArtist(date, artistId, timeSlots, serviceDuration, slotDuration, businessEndMinutes)
  } else {
    // 随机分配：检查是否有至少一个美甲师可用
    return await checkAnyArtistAvailable(date, timeSlots, serviceDuration, slotDuration, businessEndMinutes)
  }
})

// 检查指定美甲师的可用性
async function checkSpecificArtist(
  date: string,
  artistId: string,
  timeSlots: string[],
  serviceDuration: number,
  slotDuration: number,
  businessEndMinutes: number
) {
  // 查询该美甲师的排班
  const schedules = await query<any>(
    'SELECT time_slot, reason FROM nail_artist_schedules WHERE date = ? AND artist_id = ? AND is_unavailable = 1',
    [date, artistId]
  )

  // 检查是否有整天休息
  const fullDayOff = schedules.some((s: any) => s.time_slot === null || s.time_slot === '')
  // 收集不可用的时间段
  const unavailableSlots = new Set<string>()
  for (const s of schedules) {
    if (s.time_slot) unavailableSlots.add(s.time_slot)
  }

  // 查询该美甲师的已有预约
  const appointments = await query<any>(
    `SELECT a.time, COALESCE(s.duration, 30) as duration
     FROM nail_appointments a
     LEFT JOIN nail_services s ON a.service_id = s.id
     WHERE a.date = ? AND a.artist_id = ? AND a.status = 'upcoming'`,
    [date, artistId]
  )

  // 计算已有预约占用的时间段集合
  const bookedSlots = new Set<string>()
  for (const appt of appointments) {
    const occupied = getOccupiedSlots(appt.time, appt.duration, slotDuration)
    for (const slot of occupied) bookedSlots.add(slot)
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

    // 如果有服务时长，检查服务是否能完整完成
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
}

// 检查是否有至少一个美甲师可用（随机分配场景）
async function checkAnyArtistAvailable(
  date: string,
  timeSlots: string[],
  serviceDuration: number,
  slotDuration: number,
  businessEndMinutes: number
) {
  // 获取所有美甲师
  const artists = await query<any>('SELECT id FROM nail_artists')

  if (artists.length === 0) {
    return timeSlots.map(time => ({ time, available: false }))
  }

  // 查询所有美甲师在该日期的排班
  const allSchedules = await query<any>(
    'SELECT artist_id, time_slot FROM nail_artist_schedules WHERE date = ? AND is_unavailable = 1',
    [date]
  )

  // 按美甲师分组排班数据
  const artistSchedules = new Map<number, { fullDayOff: boolean; unavailableSlots: Set<string> }>()
  for (const s of allSchedules) {
    if (!artistSchedules.has(s.artist_id)) {
      artistSchedules.set(s.artist_id, { fullDayOff: false, unavailableSlots: new Set() })
    }
    const schedule = artistSchedules.get(s.artist_id)!
    if (s.time_slot === null || s.time_slot === '') {
      schedule.fullDayOff = true
    } else {
      schedule.unavailableSlots.add(s.time_slot)
    }
  }

  // 查询所有美甲师在该日期的预约
  const allAppointments = await query<any>(
    `SELECT a.artist_id, a.time, COALESCE(s.duration, 30) as duration
     FROM nail_appointments a
     LEFT JOIN nail_services s ON a.service_id = s.id
     WHERE a.date = ? AND a.status = 'upcoming'`,
    [date]
  )

  // 按美甲师分组预约数据
  const artistAppointments = new Map<number, { time: string; duration: number }[]>()
  for (const appt of allAppointments) {
    if (!artistAppointments.has(appt.artist_id)) {
      artistAppointments.set(appt.artist_id, [])
    }
    artistAppointments.get(appt.artist_id)!.push({ time: appt.time, duration: appt.duration })
  }

  // 对每个时间段，检查是否有至少一个美甲师可用
  return timeSlots.map(time => {
    for (const artist of artists) {
      const schedule = artistSchedules.get(artist.id)
      const appointments = artistAppointments.get(artist.id) || []

      // 检查该美甲师是否整天休息
      if (schedule?.fullDayOff) {
        continue
      }

      // 检查该时间段是否被排班标记为不可用
      if (schedule?.unavailableSlots.has(time)) {
        continue
      }

      // 计算该美甲师已预约的时间段
      const bookedSlots = new Set<string>()
      for (const appt of appointments) {
        const occupied = getOccupiedSlots(appt.time, appt.duration, slotDuration)
        for (const slot of occupied) bookedSlots.add(slot)
      }

      // 如果有服务时长，检查服务是否能完整完成
      if (serviceDuration > 0) {
        const endMinutes = timeToMinutes(time) + serviceDuration
        if (endMinutes > businessEndMinutes) {
          continue
        }

        // 检查服务占用的所有时间段是否与已有预约冲突
        const occupied = getOccupiedSlots(time, serviceDuration, slotDuration)
        let hasConflict = false
        for (const slot of occupied) {
          if (bookedSlots.has(slot)) {
            hasConflict = true
            break
          }
        }
        if (hasConflict) continue
      } else {
        // 无服务时长时，只检查该时间段是否被预约
        if (bookedSlots.has(time)) {
          continue
        }
      }

      // 该美甲师可用
      return { time, available: true }
    }

    // 所有美甲师都不可用
    return { time, available: false }
  })
}
