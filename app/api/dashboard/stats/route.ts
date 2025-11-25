import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/middleware"
import { query } from "@/lib/db/connection"

async function handler(
  req: NextRequest,
  user: { userId: number; email: string; roleId: number; employeeId: string }
) {
  try {
    // Get total employees
    const employeesResult = await query<{ count: number }>(
      "SELECT COUNT(*) as count FROM users WHERE is_active = 1"
    )
    const totalEmployees = employeesResult[0]?.count || 0

    // Get active projects
    const projectsResult = await query<{ count: number }>(
      "SELECT COUNT(*) as count FROM projects WHERE status IN ('planning', 'in_progress', 'on_hold')"
    )
    const activeProjects = projectsResult[0]?.count || 0

    // Get pending tasks
    const tasksResult = await query<{ count: number }>(
      "SELECT COUNT(*) as count FROM tasks WHERE status IN ('todo', 'in_progress')"
    )
    const pendingTasks = tasksResult[0]?.count || 0

    // Get total hours this month
    const hoursResult = await query<{ total: number }>(
      `SELECT ISNULL(SUM(hours), 0) as total 
       FROM time_entries 
       WHERE MONTH(date) = MONTH(GETDATE()) 
       AND YEAR(date) = YEAR(GETDATE())`
    )
    const totalHours = hoursResult[0]?.total || 0

    // Get recent projects
    const recentProjects = await query<{
      id: number
      name: string
      status: string
      client_name: string
    }>(
      `SELECT TOP 5 p.id, p.name, p.status, c.name as client_name
       FROM projects p
       LEFT JOIN clients c ON p.client_id = c.id
       ORDER BY p.created_at DESC`
    )

    // Get upcoming tasks
    const upcomingTasks = await query<{
      id: number
      title: string
      due_date: string | null
      project_name: string
    }>(
      `SELECT TOP 5 t.id, t.title, t.due_date, p.name as project_name
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.status IN ('todo', 'in_progress')
       AND (t.due_date IS NULL OR t.due_date >= GETDATE())
       ORDER BY t.due_date ASC, t.created_at DESC`
    )

    return NextResponse.json({
      totalEmployees,
      activeProjects,
      pendingTasks,
      totalHours: Math.round(totalHours * 100) / 100,
      recentProjects,
      upcomingTasks,
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(handler)

