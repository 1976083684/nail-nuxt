// 临时存储验证码（生产环境应使用Redis）
const codeStore = new Map<string, { code: string; expires: number }>()

export function setCode(phone: string, code: string) {
  codeStore.set(phone, { code, expires: Date.now() + 5 * 60 * 1000 })
}

export function getCode(phone: string): string | null {
  const entry = codeStore.get(phone)
  if (!entry) return null
  if (Date.now() > entry.expires) {
    codeStore.delete(phone)
    return null
  }
  return entry.code
}

export function deleteCode(phone: string) {
  codeStore.delete(phone)
}
