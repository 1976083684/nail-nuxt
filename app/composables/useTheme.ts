export interface Theme {
  name: string
  colors: string[]
}

export const THEMES: Record<string, Theme> = {
  mint: { name: '薄荷清晨', colors: ['#4A9E7A', '#6DB896', '#B8926A', '#F2F7F4', '#1E2E26'] },
  candy: { name: '粉黛甜心', colors: ['#E8728A', '#F4A0B0', '#D4836B', '#FFF5F3', '#3D2C32'] },
  ink: { name: '极简墨韵', colors: ['#C23A2E', '#D46860', '#8B7355', '#F7F5F0', '#1A1A1A'] },
  dusk: { name: '暮色玫瑰', colors: ['#C8836B', '#E8A898', '#D4A96A', '#0D0A0C', '#F5EDE8'] },
}

export function useTheme() {
  const currentTheme = useState<string>('theme', () => 'mint')

  function initTheme() {
    if (import.meta.client) {
      const saved = localStorage.getItem('luxe_theme') || 'mint'
      applyTheme(saved)
    }
  }

  function applyTheme(id: string) {
    currentTheme.value = id
    if (import.meta.client) {
      document.body.setAttribute('data-theme', id)
      localStorage.setItem('luxe_theme', id)
    }
  }

  return { currentTheme, initTheme, applyTheme, THEMES }
}
