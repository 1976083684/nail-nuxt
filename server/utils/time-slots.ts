/**
 * 根据营业时间生成时间段列表
 */
export function generateTimeSlots(businessStart: string, businessEnd: string, slotDuration: number): string[] {
  const slots: string[] = []
  const [startH, startM] = businessStart.split(':').map(Number)
  const [endH, endM] = businessEnd.split(':').map(Number)
  let minutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  while (minutes < endMinutes) {
    slots.push(minutesToTime(minutes))
    minutes += slotDuration
  }
  return slots
}

/**
 * 计算服务占用的时间段列表
 * 例：startTime='14:00', duration=90, slotDuration=30 → ['14:00', '14:30', '15:00']
 */
export function getOccupiedSlots(startTime: string, durationMinutes: number, slotDuration: number): string[] {
  const slots: string[] = []
  let minutes = timeToMinutes(startTime)
  const endMinutes = minutes + durationMinutes

  while (minutes < endMinutes) {
    slots.push(minutesToTime(minutes))
    minutes += slotDuration
  }
  return slots
}

/**
 * 时间字符串转分钟数
 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/**
 * 分钟数转时间字符串
 */
export function minutesToTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

/**
 * 计算结束时间
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  return minutesToTime(timeToMinutes(startTime) + durationMinutes)
}
