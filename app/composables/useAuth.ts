export interface User {
  id: number
  name: string
  avatar: string
  phone: string
}

export function useAuth() {
  const currentUser = useState<User | null>('currentUser', () => null)
  const loginCallback = useState<(() => void) | null>('loginCallback', () => null)

  function initAuth() {
    if (import.meta.client) {
      const saved = localStorage.getItem('luxe_user')
      if (saved) {
        try { currentUser.value = JSON.parse(saved) } catch {}
      }
    }
  }

  function saveUser() {
    if (import.meta.client) {
      if (currentUser.value) {
        localStorage.setItem('luxe_user', JSON.stringify(currentUser.value))
      } else {
        localStorage.removeItem('luxe_user')
      }
    }
  }

  function simulateLogin() {
    currentUser.value = {
      id: Date.now(),
      name: '微信用户',
      avatar: '/default-avatar.jpg',
      phone: '',
    }
    saveUser()
    if (loginCallback.value) {
      loginCallback.value()
      loginCallback.value = null
    }
  }

  function loginWithUser(user: User) {
    currentUser.value = user
    saveUser()
    if (loginCallback.value) {
      loginCallback.value()
      loginCallback.value = null
    }
  }

  function logout() {
    currentUser.value = null
    loginCallback.value = null
    saveUser()
  }

  function needLogin(cb: () => void) {
    if (currentUser.value) {
      cb()
    } else {
      loginCallback.value = cb
    }
  }

  return { currentUser, loginCallback, initAuth, simulateLogin, loginWithUser, logout, needLogin }
}
