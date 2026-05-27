export interface ToastItem {
  id: number
  message: string
  type: 'info' | 'success' | 'error'
  visible: boolean
}

export function useToast() {
  const toasts = useState<ToastItem[]>('toasts', () => [])

  function showToast(message: string, type: 'info' | 'success' | 'error' = 'info') {
    const id = Date.now()
    toasts.value.push({ id, message, type, visible: false })

    nextTick(() => {
      const toast = toasts.value.find(t => t.id === id)
      if (toast) toast.visible = true
    })

    setTimeout(() => {
      const toast = toasts.value.find(t => t.id === id)
      if (toast) toast.visible = false
      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id)
      }, 400)
    }, 2500)
  }

  return { toasts, showToast }
}
