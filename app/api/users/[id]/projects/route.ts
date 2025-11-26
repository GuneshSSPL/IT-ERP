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

    const pool = await getConnection()
    const request = pool.request()
    request.input("userId", sql.Int, userId)

    const result = await request.query(`
      SELECT 
        p.*,
        pa.role,
        pa.allocation_percentage,
        pa.start_date as assignment_start,
        pa.end_date as assignment_end,
        c.name as client_name,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.assigned_to = @userId) as my_task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.assigned_to = @userId AND t.status = 'done') as my_completed_tasks,
        (SELECT ISNULL(SUM(te.hours), 0) FROM time_entries te WHERE te.project_id = p.id AND te.user_id = @userId) as my_hours_logged
      FROM project_assignments pa
      INNER JOIN projects p ON pa.project_id = p.id
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE pa.user_id = @userId
      ORDER BY p.created_at DESC
    `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("User projects error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(handler)

