import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/middleware"
import { getConnection } from "@/lib/db/connection"
import sql from "mssql"

async function handler(
  req: NextRequest,
  user: { userId: number; email: string; roleId: number; employeeId: string }
) {
  try {
    // Verify user is admin
    const pool = await getConnection()
    const roleRequest = pool.request()
    roleRequest.input("userId", sql.Int, user.userId)
    const roleResult = await roleRequest.query(`
      SELECT r.name as role_name
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      WHERE u.id = @userId
    `)

    if (roleResult.recordset.length === 0 || roleResult.recordset[0].role_name !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Company Overview
    const overviewRequest = pool.request()
    const overviewResult = await overviewRequest.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE is_active = 1) as total_employees,
        (SELECT COUNT(*) FROM projects WHERE status IN ('planning', 'in_progress', 'on_hold')) as active_projects,
        (SELECT ISNULL(SUM(budget), 0) FROM projects) as total_revenue,
        (SELECT ISNULL(SUM(actual_cost), 0) FROM projects) as total_actual_cost
      FROM users
      WHERE id = 1
    `)

    // Financial Metrics
    const financialRequest = pool.request()
    const financialResult = await financialRequest.query(`
      SELECT 
        p.id,
        p.name,
        p.budget,
        p.actual_cost,
        (p.budget - ISNULL(p.actual_cost, 0)) as variance,
        CASE WHEN p.budget > 0 THEN ((p.actual_cost / p.budget) * 100) ELSE 0 END as budget_usage_percent
      FROM projects p
      WHERE p.budget IS NOT NULL
      ORDER BY p.created_at DESC
    `)

    // Resource Utilization
    const resourceRequest = pool.request()
    const resourceResult = await resourceRequest.query(`
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        (SELECT ISNULL(SUM(pa.allocation_percentage), 0) 
         FROM project_assignments pa 
         WHERE pa.user_id = u.id) as total_allocation,
        (SELECT COUNT(*) FROM project_assignments pa WHERE pa.user_id = u.id) as project_count
      FROM users u
      WHERE u.is_active = 1
      ORDER BY total_allocation DESC
    `)

    // Project Health
    const healthRequest = pool.request()
    const healthResult = await healthRequest.query(`
      SELECT TOP 10
        p.id,
        p.name,
        p.status,
        p.budget,
        p.actual_cost,
        p.end_date,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status IN ('todo', 'in_progress') 
         AND t.due_date < GETDATE()) as overdue_tasks
      FROM projects p
      WHERE p.status IN ('planning', 'in_progress', 'on_hold')
      ORDER BY 
        CASE WHEN p.end_date < GETDATE() THEN 0 ELSE 1 END,
        p.end_date ASC
    `)

    // Top Performers
    const performersRequest = pool.request()
    const performersResult = await performersRequest.query(`
      SELECT TOP 5
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        (SELECT COUNT(*) FROM tasks t WHERE t.assigned_to = u.id AND t.status = 'done' 
         AND MONTH(t.completed_at) = MONTH(GETDATE())) as tasks_completed,
        (SELECT ISNULL(SUM(te.hours), 0) FROM time_entries te 
         WHERE te.user_id = u.id AND MONTH(te.date) = MONTH(GETDATE())) as hours_logged
      FROM users u
      WHERE u.is_active = 1
      ORDER BY tasks_completed DESC, hours_logged DESC
    `)

    return NextResponse.json({
      overview: overviewResult.recordset[0],
      financial: financialResult.recordset,
      resources: resourceResult.recordset,
      projectHealth: healthResult.recordset,
      topPerformers: performersResult.recordset,
    })
  } catch (error) {
    console.error("Admin dashboard error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(handler)

