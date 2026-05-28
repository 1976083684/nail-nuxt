import { query, queryOne } from '../../utils/db'
import { formatDate, formatDateOnly } from '../../utils/format'

export default defineEventHandler(async () => {
  const totalAppointments = await queryOne<any>('SELECT COUNT(*) as count FROM nail_appointments')
  const todayAppointments = await queryOne<any>("SELECT COUNT(*) as count FROM nail_appointments WHERE date = CURDATE()")
  const upcomingAppointments = await queryOne<any>("SELECT COUNT(*) as count FROM nail_appointments WHERE status = 'upcoming'")
  // 兼容 account_type 字段未添加的情况
  let totalUsers
  try {
    totalUsers = await queryOne<any>("SELECT COUNT(*) as count FROM sys_users WHERE account_type = 'user' OR account_type IS NULL")
  } catch {
    totalUsers = await queryOne<any>('SELECT COUNT(*) as count FROM sys_users')
  }
  const totalServices = await queryOne<any>('SELECT COUNT(*) as count FROM nail_services')
  const totalArtists = await queryOne<any>('SELECT COUNT(*) as count FROM nail_artists')

  // 累计收入（已完成的预约）
  const totalRevenue = await queryOne<any>(`
    SELECT COALESCE(SUM(s.price), 0) as revenue
    FROM nail_appointments a
    JOIN nail_services s ON a.service_id = s.id
    WHERE a.status = 'completed'
  `)

  // 本月收入
  const monthRevenue = await queryOne<any>(`
    SELECT COALESCE(SUM(s.price), 0) as revenue
    FROM nail_appointments a
    JOIN nail_services s ON a.service_id = s.id
    WHERE a.status = 'completed'
      AND YEAR(a.date) = YEAR(CURDATE())
      AND MONTH(a.date) = MONTH(CURDATE())
  `)

  // 近30天预约趋势
  const chartData = await query<any>(`
    SELECT DATE(date) as date, COUNT(*) as count
    FROM nail_appointments
    WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY DATE(date)
    ORDER BY date
  `)

  // 近30天收入趋势
  const revenueTrend = await query<any>(`
    SELECT DATE(a.date) as date, COALESCE(SUM(s.price), 0) as revenue
    FROM nail_appointments a
    JOIN nail_services s ON a.service_id = s.id
    WHERE a.status = 'completed'
      AND a.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY DATE(a.date)
    ORDER BY date
  `)

  // 近6个月预约月度统计
  const monthlyStats = await query<any>(`
    SELECT DATE_FORMAT(date, '%Y-%m') as month, COUNT(*) as count
    FROM nail_appointments
    WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    GROUP BY DATE_FORMAT(date, '%Y-%m')
    ORDER BY month
  `)

  // 用户注册分析
  let todayNewUsers, monthNewUsers, userRegistrationTrend, monthlyUserStats
  try {
    todayNewUsers = await queryOne<any>("SELECT COUNT(*) as count FROM sys_users WHERE DATE(created_at) = CURDATE() AND (account_type = 'user' OR account_type IS NULL)")
    monthNewUsers = await queryOne<any>("SELECT COUNT(*) as count FROM sys_users WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE()) AND (account_type = 'user' OR account_type IS NULL)")
    userRegistrationTrend = await query<any>(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM sys_users
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND (account_type = 'user' OR account_type IS NULL)
      GROUP BY DATE(created_at)
      ORDER BY date
    `)
    monthlyUserStats = await query<any>(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
      FROM sys_users
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        AND (account_type = 'user' OR account_type IS NULL)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month
    `)
  } catch {
    todayNewUsers = { count: 0 }
    monthNewUsers = { count: 0 }
    userRegistrationTrend = []
    monthlyUserStats = []
  }

  // 各服务预约占比
  const serviceStats = await query<any>(`
    SELECT s.name, COUNT(*) as count
    FROM nail_appointments a
    JOIN nail_services s ON a.service_id = s.id
    GROUP BY s.id, s.name
    ORDER BY count DESC
  `)

  // 各美甲师预约量
  const artistStats = await query<any>(`
    SELECT ar.name, COUNT(*) as count
    FROM nail_appointments a
    JOIN nail_artists ar ON a.artist_id = ar.id
    WHERE a.artist_id IS NOT NULL
    GROUP BY ar.id, ar.name
    ORDER BY count DESC
  `)

  // 最近预约
  const recentAppointmentsRaw = await query<any>(`
    SELECT a.id, a.customer_name, a.date, a.time, a.status, s.name as serviceName
    FROM nail_appointments a
    LEFT JOIN nail_services s ON a.service_id = s.id
    ORDER BY a.created_at DESC
    LIMIT 5
  `)

  // 格式化日期
  const recentAppointments = recentAppointmentsRaw.map(item => ({
    ...item,
    date: formatDateOnly(item.date),
  }))

  return {
    stats: {
      totalAppointments: totalAppointments?.count || 0,
      todayAppointments: todayAppointments?.count || 0,
      upcomingAppointments: upcomingAppointments?.count || 0,
      totalUsers: totalUsers?.count || 0,
      todayNewUsers: todayNewUsers?.count || 0,
      monthNewUsers: monthNewUsers?.count || 0,
      totalServices: totalServices?.count || 0,
      totalArtists: totalArtists?.count || 0,
      totalRevenue: Number(totalRevenue?.revenue) || 0,
      monthRevenue: Number(monthRevenue?.revenue) || 0,
    },
    chartData,
    revenueTrend,
    monthlyStats,
    userRegistrationTrend,
    monthlyUserStats,
    serviceStats,
    artistStats,
    recentAppointments,
  }
})
