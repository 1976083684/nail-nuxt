import { query, queryOne } from '../../../utils/db'
import { getSettings } from '../../../utils/db'
import { getOccupiedSlots } from '../../../utils/time-slots'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  // 获取取消时间限制配置（默认6小时）
  const setting = await queryOne<any>(
    "SELECT setting_value FROM sys_site_settings WHERE setting_key = 'cancel_hours'"
  )
  const cancelHours = Number(setting?.setting_value) || 6

  // 查询预约信息
  const appointment = await queryOne<any>(
    'SELECT * FROM nail_appointments WHERE id = ?',
    [id]
  )
  if (!appointment) {
    throw createError({ statusCode: 404, message: '预约不存在' })
  }

  if (appointment.status !== 'upcoming') {
    throw createError({ statusCode: 400, message: '该预约无法取消' })
  }

  // 计算预约时间与当前时间的差值
  const appointmentTime = new Date(`${appointment.date}T${appointment.time}:00`)
  const now = new Date()
  const hoursUntil = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursUntil < cancelHours) {
    throw createError({
      statusCode: 400,
      message: `预约时间${cancelHours}小时内不可取消`
    })
  }

  await query(
    "UPDATE nail_appointments SET status = 'cancelled' WHERE id = ?",
    [id]
  )

  // 释放排班表中被预约阻塞的时间段
  if (appointment.artist_id) {
    const service = await queryOne<any>(
      'SELECT duration FROM nail_services WHERE id = ?',
      [appointment.service_id]
    )
    const duration = service?.duration || 30
    const settings = await getSettings()
    const slotDuration = Number(settings.slot_duration) || 30
    const occupiedSlots = getOccupiedSlots(appointment.time, duration, slotDuration)

    // 将排班时间段标记为已取消，恢复可预约
    if (occupiedSlots.length > 0) {
      await query(
        `UPDATE nail_artist_schedules
         SET is_unavailable = 0, reason = '已取消'
         WHERE artist_id = ? AND date = ? AND reason = '已预约'
         AND time_slot IN (${occupiedSlots.map(() => '?').join(',')})`,
        [appointment.artist_id, appointment.date, ...occupiedSlots]
      )
    }
  }

  return { success: true }
})
