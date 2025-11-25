import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/middleware"
import { query, getConnection } from "@/lib/db/connection"

async function handler(
  req: NextRequest,
  user: { userId: number; email: string; roleId: number; employeeId: string }
) {
  try {
    if (req.method === "GET") {
      const { searchParams } = new URL(req.url)
      const projectId = searchParams.get("projectId")
      const userId = searchParams.get("userId") || user.userId.toString()
      const startDate = searchParams.get("startDate")
      const endDate = searchParams.get("endDate")

      let queryStr = `
        SELECT te.id, te.user_id, te.project_id, te.task_id, te.date, te.hours, 
               te.description, te.billable, te.approved_by, te.approved_at,
               p.name as project_name,
               t.title as task_title,
               u.first_name + ' ' + u.last_name as user_name
        FROM time_entries te
        LEFT JOIN projects p ON te.project_id = p.id
        LEFT JOIN tasks t ON te.task_id = t.id
        LEFT JOIN users u ON te.user_id = u.id
        WHERE te.user_id = @userId
      `

      const params: Record<string, any> = { userId: parseInt(userId) }

      if (projectId) {
        queryStr += " AND te.project_id = @projectId"
        params.projectId = parseInt(projectId)
      }
      if (startDate) {
        queryStr += " AND te.date >= @startDate"
        params.startDate = startDate
      }
      if (endDate) {
        queryStr += " AND te.date <= @endDate"
        params.endDate = endDate
      }

      queryStr += " ORDER BY te.date DESC, te.created_at DESC"

      const entries = await query(queryStr, params)

      return NextResponse.json(entries)
    }

    if (req.method === "POST") {
      const body = await req.json()
      const {
        projectId,
        taskId,
        date,
        hours,
        description,
        billable = true,
      } = body

      if (!projectId || !date || !hours) {
        return NextResponse.json(
          { error: "Project ID, date, and hours are required" },
          { status: 400 }
        )
      }

      const pool = await getConnection()
      const request = pool.request()
      request.input("user_id", user.userId)
      request.input("project_id", projectId)
      request.input("task_id", taskId || null)
      request.input("date", date)
      request.input("hours", parseFloat(hours))
      request.input("description", description || null)
      request.input("billable", billable)

      const result = await request.query(`
        INSERT INTO time_entries (user_id, project_id, task_id, date, hours, 
                                 description, billable, created_at, updated_at)
        OUTPUT INSERTED.id, INSERTED.date, INSERTED.hours
        VALUES (@user_id, @project_id, @task_id, @date, @hours, 
                @description, @billable, GETDATE(), GETDATE())
      `)

      return NextResponse.json(result.recordset[0], { status: 201 })
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  } catch (error) {
    console.error("Time entries API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(handler)
export const POST = requireAuth(handler)

