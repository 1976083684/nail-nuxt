export interface BookingState {
  step: number
  serviceId: number | null
  artistId: number | null
  date: Date | null
  time: string | null
  name: string
  phone: string
  note: string
  calYear: number
  calMonth: number
}

export const STEP_LABELS = ['服务', '美甲师', '时间', '信息', '确认']
export const STEP_COUNT = 5

export const TIME_SLOTS: string[] = []
for (let h = 10; h <= 19; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`)
  if (h < 19) TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`)
}

export function useBooking() {
  const bookingState = useState<BookingState>('bookingState', () => ({
    step: 0,
    serviceId: null,
    artistId: null,
    date: null,
    time: null,
    name: '',
    phone: '',
    note: '',
    calYear: new Date().getFullYear(),
    calMonth: new Date().getMonth(),
  }))

  function resetBooking(partial?: Partial<BookingState>) {
    const now = new Date()
    bookingState.value = {
      step: partial?.serviceId ? 1 : partial?.artistId ? 1 : 0,
      serviceId: partial?.serviceId ?? null,
      artistId: partial?.artistId ?? null,
      date: null,
      time: null,
      name: '',
      phone: '',
      note: '',
      calYear: now.getFullYear(),
      calMonth: now.getMonth(),
    }
  }

  function nextStep() {
    if (bookingState.value.step < STEP_COUNT - 1) {
      bookingState.value.step++
    }
  }

  function prevStep() {
    if (bookingState.value.step > 0) {
      bookingState.value.step--
    }
  }

  function dateToString(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  function formatDateDisplay(ds: string): string {
    const d = new Date(ds)
    const w = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${d.getMonth() + 1}月${d.getDate()}日 ${w[d.getDay()]}`
  }

  return {
    bookingState, STEP_LABELS, STEP_COUNT, TIME_SLOTS,
    resetBooking, nextStep, prevStep, dateToString, formatDateDisplay,
  }
}
