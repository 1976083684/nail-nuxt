import { query, queryOne } from '../../../utils/db'
import { getSettings } from '../../../utils/db'
import { getOccupiedSlots } from '../../../utils/time-slots'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { status, artistId } = body

  const updates: string[] = []
  const params: any[] = []

  if (status) {
    updates.push('status = ?')
    params.push(status)
  }
  if (artistId !== undefined) {
    updates.push('artist_id = ?')
    params.push(artistId || null)
  }

  if (updates.length === 0) {
    throw createError({ statusCode: 400, message: '没有需要更新的字段' })
  }

  // 先查询当前预约信息（状态变更前）
  const appointment = await queryOne<any>(
    'SELECT * FROM nail_appointments WHERE id = ?',
    [id]
  )

  params.push(id)
  await query(`UPDATE nail_appointments SET ${updates.join(', ')} WHERE id = ?`, params)

  // 状态变更后更新排班表
  if (status && appointment?.artist_id) {
    const service = await queryOne<any>(
      'SELECT duration FROM nail_services WHERE id = ?',
      [appointment.service_id]
    )
    const duration = service?.duration || 30
    const settings = await getSettings()
    const slotDuration = Number(settings.slot_duration) || 30
    const occupiedSlots = getOccupiedSlots(appointment.time, duration, slotDuration)

    if (occupiedSlots.length > 0) {
      if (status === 'cancelled') {
        // 取消预约：将排班时间段标记为已取消，恢复可预约
        await query(
          `UPDATE nail_artist_schedules
           SET is_unavailable = 0, reason = '已取消'
           WHERE artist_id = ? AND date = ? AND reason = '已预约'
           AND time_slot IN (${occupiedSlots.map(() => '?').join(',')})`,
          [appointment.artist_id, appointment.date, ...occupiedSlots]
        )
      } else if (status === 'completed') {
        // 完成预约：将 reason 改为'完成服务'，保持 is_unavailable=1
        await query(
          `UPDATE nail_artist_schedules
           SET reason = '完成服务'
           WHERE artist_id = ? AND date = ? AND reason = '已预约'
           AND time_slot IN (${occupiedSlots.map(() => '?').join(',')})`,
          [appointment.artist_id, appointment.date, ...occupiedSlots]
        )
      }
    }
  }

  return { success: true }
})
