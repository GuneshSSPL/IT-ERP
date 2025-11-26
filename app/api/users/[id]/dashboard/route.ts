import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/middleware"
import { getConnection } from "@/lib/db/connection"
import sql from "mssql"

async function handler(
  req: NextRequest,
  user: { userId: number; email: string; roleId: number; employeeId: string },
  context?: { params?: Promise<Record<string, string>> }
) {
  try {
    if (!context?.params) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    const { id } = await context.params
    const userId = parseInt(id)

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Verify user can access this data (own data or admin/manager)
    if (userId !== user.userId) {
      // Check if user is admin or manager
      const roleCheck = await getConnection()
      const roleRequest = roleCheck.request()
      roleRequest.input("userId", sql.Int, user.userId)
      const roleResult = await roleRequest.query(`
        SELECT r.name as role_name
        FROM users u
        INNER JOIN roles r ON u.role_id = r.id
        WHERE u.id = @userId
      `)
      
      if (roleResult.recordset.length === 0 || 
          !["admin", "manager"].includes(roleResult.recordset[0].role_name)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    const pool = await getConnection()

    // Get user's projects
    const projectsRequest = pool.request()
    projectsRequest.input("userId", sql.Int, userId)
    const projectsResult = await projectsRequest.query(`
      SELECT 
        p.id,
        p.name,
        p.code,
        p.status,
        pa.role,
        pa.allocation_percentage,
        p.start_date,
        p.end_date,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.assigned_to = @userId) as task_count,
        (SELECT ISNULL(SUM(te.hours), 0) 
         FROM time_entries te 
         WHERE te.project_id = p.id AND te.user_id = @userId 
         AND MONTH(te.date) = MONTH(GETDATE()) 
         AND YEAR(te.date) = YEAR(GETDATE())) as hours_this_month
      FROM project_assignments pa
      INNER JOIN projects p ON pa.project_id = p.id
      WHERE pa.user_id = @userId
      ORDER BY p.created_at DESC
    `)

    // Get user's tasks
    const tasksRequest = pool.request()
    tasksRequest.input("userId", sql.Int, userId)
    const tasksResult = await tasksRequest.query(`
      SELECT 
        t.id,
        t.title,
        t.status,
        t.priority,
        t.due_date,
        t.estimated_hours,
        t.actual_hours,
        p.name as project_name,
        p.code as project_code
      FROM tasks t
      INNER JOIN projects p ON t.project_id = p.id
      WHERE t.assigned_to = @userId
      AND t.status IN ('todo', 'in_progress', 'review')
      ORDER BY 
        CASE WHEN t.due_date < GETDATE() THEN 0 ELSE 1 END,
        t.due_date ASC,
        t.priority DESC
    `)

    // Get time tracking summary
    const timeRequest = pool.request()
    timeRequest.input("userId", sql.Int, userId)
    const timeResult = await timeRequest.query(`
      SELECT 
        ISNULL(SUM(CASE WHEN te.date >= DATEADD(day, -7, GETDATE()) THEN te.hours ELSE 0 END), 0) as hours_this_week,
        ISNULL(SUM(CASE WHEN MONTH(te.date) = MONTH(GETDATE()) AND YEAR(te.date) = YEAR(GETDATE()) THEN te.hours ELSE 0 END), 0) as hours_this_month,
        ISNULL(SUM(CASE WHEN te.billable = 1 AND MONTH(te.date) = MONTH(GETDATE()) AND YEAR(te.date) = YEAR(GETDATE()) THEN te.hours ELSE 0 END), 0) as billable_hours_month,
        ISNULL(SUM(CASE WHEN te.billable = 0 AND MONTH(te.date) = MONTH(GETDATE()) AND YEAR(te.date) = YEAR(GETDATE()) THEN te.hours ELSE 0 END), 0) as non_billable_hours_month
      FROM time_entries te
      WHERE te.user_id = @userId
    `)

    // Get time by project
    const timeByProjectRequest = pool.request()
    timeByProjectRequest.input("userId", sql.Int, userId)
    const timeByProjectResult = await timeByProjectRequest.query(`
      SELECT TOP 5
        p.name as project_name,
        ISNULL(SUM(te.hours), 0) as total_hours
      FROM time_entries te
      INNER JOIN projects p ON te.project_id = p.id
      WHERE te.user_id = @userId
      AND MONTH(te.date) = MONTH(GETDATE())
      AND YEAR(te.date) = YEAR(GETDATE())
      GROUP BY p.name
      ORDER BY total_hours DESC
    `)

    // Get performance metrics
    const perfRequest = pool.request()
    perfRequest.input("userId", sql.Int, userId)
    const perfResult = await perfRequest.query(`
      SELECT 
        (SELECT COUNT(*) FROM tasks t WHERE t.assigned_to = @userId AND t.status = 'done' 
         AND MONTH(t.completed_at) = MONTH(GETDATE()) AND YEAR(t.completed_at) = YEAR(GETDATE())) as tasks_completed_month,
        (SELECT COUNT(*) FROM tasks t WHERE t.assigned_to = @userId AND t.status = 'done' 
         AND t.completed_at <= t.due_date) as tasks_on_time,
        (SELECT COUNT(*) FROM tasks t WHERE t.assigned_to = @userId AND t.status = 'done') as total_tasks_completed,
        (SELECT AVG(DATEDIFF(day, t.created_at, t.completed_at)) 
         FROM tasks t WHERE t.assigned_to = @userId AND t.status = 'done' AND t.completed_at IS NOT NULL) as avg_completion_days
      FROM users u
      WHERE u.id = @userId
    `)

    // Get user skills
    const skillsRequest = pool.request()
    skillsRequest.input("userId", sql.Int, userId)
    const skillsResult = await skillsRequest.query(`
      SELECT 
        s.name,
        s.category,
        us.proficiency_level,
        us.years_experience,
        us.certified
      FROM user_skills us
      INNER JOIN skills s ON us.skill_id = s.id
      WHERE us.user_id = @userId
      ORDER BY us.proficiency_level DESC, s.name
    `)

    const performance = perfResult.recordset[0] || {}
    const onTimeRate = performance.total_tasks_completed > 0
      ? (performance.tasks_on_time / performance.total_tasks_completed) * 100
      : 0

    return NextResponse.json({
      projects: projectsResult.recordset,
      tasks: tasksResult.recordset,
      timeTracking: {
        ...timeResult.recordset[0],
        byProject: timeByProjectResult.recordset,
      },
      performance: {
        ...performance,
        onTimeRate: Math.round(onTimeRate),
      },
      skills: skillsResult.recordset,
    })
  } catch (error) {
    console.error("User dashboard error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(handler)

