import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/middleware"
import { getConnection } from "@/lib/db/connection"
import sql from "mssql"

async function handler(
  req: NextRequest,
  user: { userId: number; email: string; roleId: number; employeeId: string },
  context?: { params?: Promise<{ id: string }> }
) {
  try {
    if (!context?.params) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    const { id } = await context.params
    const projectId = parseInt(id)

    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
    }

    const pool = await getConnection()

    // Get project details
    const projectRequest = pool.request()
    projectRequest.input("projectId", sql.Int, projectId)
    const projectResult = await projectRequest.query(`
      SELECT 
        p.*,
        c.name as client_name,
        c.email as client_email,
        CONCAT(pm.first_name, ' ', pm.last_name) as manager_name,
        pm.email as manager_email
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN users pm ON p.project_manager_id = pm.id
      WHERE p.id = @projectId
    `)

    if (projectResult.recordset.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const project = projectResult.recordset[0]

    // Get team members
    const teamRequest = pool.request()
    teamRequest.input("projectId", sql.Int, projectId)
    const teamResult = await teamRequest.query(`
      SELECT 
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email,
        pa.role,
        pa.allocation_percentage,
        pa.hourly_rate
      FROM project_assignments pa
      INNER JOIN users u ON pa.user_id = u.id
      WHERE pa.project_id = @projectId
    `)

    // Get project phases
    const phasesRequest = pool.request()
    phasesRequest.input("projectId", sql.Int, projectId)
    const phasesResult = await phasesRequest.query(`
      SELECT * FROM project_phases
      WHERE project_id = @projectId
      ORDER BY sequence
    `)

    // Get tasks breakdown
    const tasksRequest = pool.request()
    tasksRequest.input("projectId", sql.Int, projectId)
    const tasksResult = await tasksRequest.query(`
      SELECT 
        status,
        COUNT(*) as count,
        ISNULL(SUM(estimated_hours), 0) as total_estimated,
        ISNULL(SUM(actual_hours), 0) as total_actual
      FROM tasks
      WHERE project_id = @projectId
      GROUP BY status
    `)

    // Get time tracking summary
    const timeRequest = pool.request()
    timeRequest.input("projectId", sql.Int, projectId)
    const timeResult = await timeRequest.query(`
      SELECT 
        ISNULL(SUM(te.hours), 0) as total_hours,
        ISNULL(SUM(CASE WHEN te.billable = 1 THEN te.hours ELSE 0 END), 0) as billable_hours,
        ISNULL(SUM(te.hours * COALESCE(pa.hourly_rate, 0)), 0) as total_cost
      FROM time_entries te
      LEFT JOIN project_assignments pa ON te.user_id = pa.user_id AND te.project_id = pa.project_id
      WHERE te.project_id = @projectId
    `)

    // Get recent activities
    const activitiesRequest = pool.request()
    activitiesRequest.input("projectId", sql.Int, projectId)
    const activitiesResult = await activitiesRequest.query(`
      SELECT TOP 10
        al.id,
        al.action,
        al.description,
        al.created_at,
        CONCAT(u.first_name, ' ', u.last_name) as user_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.project_id = @projectId
      ORDER BY al.created_at DESC
    `)

    // Calculate project health score
    const healthScore = calculateProjectHealth(project, tasksResult.recordset, timeResult.recordset[0])

    return NextResponse.json({
      project,
      team: teamResult.recordset,
      phases: phasesResult.recordset,
      tasks: tasksResult.recordset,
      timeTracking: timeResult.recordset[0] || { total_hours: 0, billable_hours: 0, total_cost: 0 },
      activities: activitiesResult.recordset,
      healthScore,
    })
  } catch (error) {
    console.error("Project detail error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

function calculateProjectHealth(
  project: any,
  tasks: any,
  timeTracking: any
): number {
  let score = 100

  // Budget health (30% weight)
  if (project.budget && project.actual_cost) {
    const budgetUsage = (project.actual_cost / project.budget) * 100
    if (budgetUsage > 90) score -= 20
    else if (budgetUsage > 75) score -= 10
  }

  // Timeline health (30% weight)
  if (project.end_date) {
    const endDate = new Date(project.end_date)
    const today = new Date()
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const totalDays = Math.ceil(
      (endDate.getTime() - new Date(project.start_date || today).getTime()) / (1000 * 60 * 60 * 24)
    )
    const progress = ((totalDays - daysRemaining) / totalDays) * 100

    // Check task completion vs time progress
    const taskArray = Array.isArray(tasks) ? tasks : tasks.recordset || []
    const totalTasks = taskArray.reduce((sum: number, t: any) => sum + t.count, 0)
    const completedTasks = taskArray.find((t: any) => t.status === "done")?.count || 0
    const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    if (taskProgress < progress - 10) score -= 15
    if (daysRemaining < 0) score -= 25
  }

    // Task health (20% weight)
    const taskArray = Array.isArray(tasks) ? tasks : tasks.recordset || []
    const overdueTasks = taskArray.find((t: any) => t.status === "todo" || t.status === "in_progress")
    if (overdueTasks && overdueTasks.count > 5) score -= 10

  // Status health (20% weight)
  if (project.status === "on_hold") score -= 15
  if (project.status === "cancelled") score = 0

  return Math.max(0, Math.min(100, score))
}

export const GET = requireAuth(handler)

