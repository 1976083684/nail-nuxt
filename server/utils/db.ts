import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

export function getPool(): mysql.Pool {
  if (!pool) {
    const config = useRuntimeConfig()
    pool = mysql.createPool({
      host: config.dbHost || 'localhost',
      port: Number(config.dbPort) || 3306,
      user: config.dbUser || 'root',
      password: config.dbPassword || '123456',
      database: config.dbName || 'luxe_nail',
      waitForConnections: true,
      connectionLimit: 10,
      charset: 'utf8mb4',
      dateStrings: true,
    })
  }
  return pool
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const pool = getPool()
  const [rows] = await pool.execute(sql, params)
  return rows as T[]
}

export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] || null
}

/**
 * 事务封装
 */
export async function transaction<T>(fn: (conn: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const pool = getPool()
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const result = await fn(conn)
    await conn.commit()
    return result
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}

/**
 * 获取站点配置
 */
export async function getSettings(): Promise<Record<string, string>> {
  const rows = await query<{ setting_key: string; setting_value: string }>(
    'SELECT setting_key, setting_value FROM sys_site_settings'
  )
  const map: Record<string, string> = {}
  for (const r of rows) map[r.setting_key] = r.setting_value
  return map
}
