import jwt from 'jsonwebtoken'

const SECRET = 'luxe-nail-admin-secret-key-2024'

export interface AdminPayload {
  id: number
  username: string
  name: string
  role: string
  permissions?: Record<string, boolean> | null
}

export function signToken(payload: AdminPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: '24h' })
}

export function verifyToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, SECRET) as AdminPayload
  } catch {
    return null
  }
}
