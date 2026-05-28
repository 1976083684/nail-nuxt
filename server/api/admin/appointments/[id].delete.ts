import { query, queryOne } from '../../../utils/db'
import { getSettings } from '../../../utils/db'
import { getOccupiedSlots } from '../../../utils/time-slots'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  // 先查询预约信息（用于释放排班时间段）
  const appointment = await queryOne<any>(
    'SELECT * FROM nail_appointments WHERE id = ?',
    [id]
  )

  await query('DELETE FROM nail_appointments WHERE id = ?', [id])

  // 释放排班表中被预约阻塞的时间段
  if (appointment?.artist_id) {
    const service = await queryOne<any>(
      'SELECT duration FROM nail_services WHERE id = ?',
      [appointment.service_id]
    )
    const duration = service?.duration || 30
    const settings = await getSettings()
    const slotDuration = Number(settings.slot_duration) || 30
    const occupiedSlots = getOccupiedSlots(appointment.time, duration, slotDuration)

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
