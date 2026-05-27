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
