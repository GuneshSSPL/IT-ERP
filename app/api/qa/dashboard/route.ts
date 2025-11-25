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

    // Get QA tasks
    const tasksRequest = pool.request()
    tasksRequest.input("userId", sql.Int, user.userId)
    const tasksResult = await tasksRequest.query(`
      SELECT 
        t.*,
        p.name as project_name,
        p.code as project_code
      FROM tasks t
      INNER JOIN projects p ON t.project_id = p.id
      WHERE t.assigned_to = @userId
      AND (t.title LIKE '%test%' OR t.title LIKE '%QA%' OR t.title LIKE '%quality%')
      ORDER BY t.due_date ASC
    `)

    // Get bug count by project
    const bugsRequest = pool.request()
    bugsRequest.input("userId", sql.Int, user.userId)
    const bugsResult = await bugsRequest.query(`
      SELECT 
        p.id,
        p.name,
        COUNT(*) as bug_count
      FROM tasks t
      INNER JOIN projects p ON t.project_id = p.id
      WHERE t.assigned_to = @userId
      AND (t.title LIKE '%bug%' OR t.title LIKE '%defect%' OR t.status = 'review')
      GROUP BY p.id, p.name
      ORDER BY bug_count DESC
    `)

    return NextResponse.json({
      tasks: tasksResult.recordset,
      bugsByProject: bugsResult.recordset,
    })
  } catch (error) {
    console.error("QA dashboard error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(handler)

