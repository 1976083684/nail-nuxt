import { query, queryOne, transaction } from '../../utils/db'
import { getSettings } from '../../utils/db'
import { getOccupiedSlots, calculateEndTime, timeToMinutes } from '../../utils/time-slots'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { userId, serviceId, artistId, date, time, name, phone, note } = body

  if (!userId || !serviceId || !date || !time || !name || !phone) {
    throw createError({ statusCode: 400, message: '缺少必要参数' })
  }

  // 确保用户存在
  let user = await queryOne<any>('SELECT id FROM sys_users WHERE id = ?', [userId])
  if (!user) {
    await query(
      'INSERT INTO sys_users (id, name, phone) VALUES (?, ?, ?)',
      [userId, name, phone]
    )
  }

  // 获取服务时长
  const service = await queryOne<any>('SELECT duration FROM nail_services WHERE id = ?', [serviceId])
  if (!service) {
    throw createError({ statusCode: 400, message: '服务不存在' })
  }
  const duration = service.duration

  // 获取时间段配置
  const settings = await getSettings()
  const slotDuration = Number(settings.slot_duration) || 30
  const businessEnd = settings.business_hours_end || '19:00'

  // 计算占用时间段和结束时间
  const occupiedSlots = getOccupiedSlots(time, duration, slotDuration)
  const endTime = calculateEndTime(time, duration)

  // 检查是否超出营业时间
  if (timeToMinutes(endTime) > timeToMinutes(businessEnd)) {
    throw createError({ statusCode: 400, message: '服务结束时间超出营业时间，请选择更早的时间' })
  }

  const actualArtistId = artistId || null

  // 使用事务进行冲突检查和插入
  const result = await transaction(async (conn) => {
    if (actualArtistId) {
      // 检查排班冲突
      const scheduleConflicts = await conn.execute(
        `SELECT id FROM nail_artist_schedules
         WHERE artist_id = ? AND date = ? AND is_unavailable = 1
         AND (time_slot IS NULL OR time_slot IN (${occupiedSlots.map(() => '?').join(',')}))`,
        [actualArtistId, date, ...occupiedSlots]
      )
      if ((scheduleConflicts[0] as any[]).length > 0) {
        throw createError({ statusCode: 409, message: '该时间段美甲师不可用，请选择其他时间' })
      }

      // 检查已有预约冲突（锁定行防止并发）
      const existingAppointments = await conn.execute(
        `SELECT a.time, COALESCE(s.duration, 30) as duration
         FROM nail_appointments a
         LEFT JOIN nail_services s ON a.service_id = s.id
         WHERE a.date = ? AND a.status = 'upcoming' AND a.artist_id = ?
         FOR UPDATE`,
        [date, actualArtistId]
      )

      for (const appt of existingAppointments[0] as any[]) {
        const apptSlots = getOccupiedSlots(appt.time, appt.duration, slotDuration)
        for (const slot of apptSlots) {
          if (occupiedSlots.includes(slot)) {
            throw createError({ statusCode: 409, message: '该时间段已被预约，请选择其他时间' })
          }
        }
      }
    }

    // 插入预约
    const insertResult = await conn.execute(
      `INSERT INTO nail_appointments (user_id, service_id, artist_id, date, time, end_time, customer_name, customer_phone, note, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming')`,
      [userId, serviceId, actualArtistId, date, time, endTime, name, phone, note || '']
    )
    return insertResult[0]
  })

  return { success: true, id: (result as any).insertId }
})
