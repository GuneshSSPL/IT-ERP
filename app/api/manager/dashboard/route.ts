import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/middleware"
import { getConnection } from "@/lib/db/connection"
import sql from "mssql"

async function handler(
  req: NextRequest,
  user: { userId: number; email: string; roleId: number; employeeId: string }
) {
  try {
    const pool = await getConnection()

    // Get managed projects
    const projectsRequest = pool.request()
    projectsRequest.input("userId", sql.Int, user.userId)
    const projectsResult = await projectsRequest.query(`
      SELECT 
        p.*,
        c.name as client_name,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as total_tasks,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') as completed_tasks,
        (SELECT ISNULL(SUM(te.hours), 0) FROM time_entries te WHERE te.project_id = p.id) as total_hours
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.project_manager_id = @userId
      ORDER BY p.created_at DESC
    `)

    // Get team workload
    const workloadRequest = pool.request()
    workloadRequest.input("userId", sql.Int, user.userId)
    const workloadResult = await workloadRequest.query(`
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        (SELECT ISNULL(SUM(pa.allocation_percentage), 0) 
         FROM project_assignments pa 
         INNER JOIN projects p ON pa.project_id = p.id
         WHERE pa.user_id = u.id AND p.project_manager_id = @userId) as total_allocation,
        (SELECT COUNT(*) FROM project_assignments pa 
         INNER JOIN projects p ON pa.project_id = p.id
         WHERE pa.user_id = u.id AND p.project_manager_id = @userId) as project_count
      FROM project_assignments pa
      INNER JOIN users u ON pa.user_id = u.id
      INNER JOIN projects p ON pa.project_id = p.id
      WHERE p.project_manager_id = @userId
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY total_allocation DESC
    `)

    return NextResponse.json({
      projects: projectsResult.recordset,
      teamWorkload: workloadResult.recordset,
    })
  } catch (error) {
    console.error("Manager dashboard error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(handler)

