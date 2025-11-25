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
      const assignedTo = searchParams.get("assignedTo")
      const status = searchParams.get("status")

      let queryStr = `
        SELECT t.id, t.project_id, t.phase_id, t.title, t.description, 
               t.assigned_to, t.created_by, t.status, t.priority, 
               t.estimated_hours, t.actual_hours, t.due_date, t.completed_at,
               p.name as project_name,
               u.first_name + ' ' + u.last_name as assigned_to_name,
               c.first_name + ' ' + c.last_name as created_by_name
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN users c ON t.created_by = c.id
        WHERE 1=1
      `

      const params: Record<string, any> = {}
      if (projectId) {
        queryStr += " AND t.project_id = @projectId"
        params.projectId = parseInt(projectId)
      }
      if (assignedTo) {
        queryStr += " AND t.assigned_to = @assignedTo"
        params.assignedTo = parseInt(assignedTo)
      }
      if (status) {
        queryStr += " AND t.status = @status"
        params.status = status
      }

      queryStr += " ORDER BY t.created_at DESC"

      const tasks = await query(queryStr, params)

      return NextResponse.json(tasks)
    }

    if (req.method === "POST") {
      const body = await req.json()
      const {
        projectId,
        phaseId,
        title,
        description,
        assignedTo,
        status = "todo",
        priority = "medium",
        estimatedHours,
        dueDate,
      } = body

      if (!projectId || !title || !assignedTo) {
        return NextResponse.json(
          { error: "Project ID, title, and assigned to are required" },
          { status: 400 }
        )
      }

      const pool = await getConnection()
      const request = pool.request()
      request.input("project_id", projectId)
      request.input("phase_id", phaseId || null)
      request.input("title", title)
      request.input("description", description || null)
      request.input("assigned_to", assignedTo)
      request.input("created_by", user.userId)
      request.input("status", status)
      request.input("priority", priority)
      request.input("estimated_hours", estimatedHours || null)
      request.input("due_date", dueDate || null)

      const result = await request.query(`
        INSERT INTO tasks (project_id, phase_id, title, description, assigned_to, 
                          created_by, status, priority, estimated_hours, actual_hours, 
                          due_date, created_at, updated_at)
        OUTPUT INSERTED.id, INSERTED.title, INSERTED.status
        VALUES (@project_id, @phase_id, @title, @description, @assigned_to, 
                @created_by, @status, @priority, @estimated_hours, 0, 
                @due_date, GETDATE(), GETDATE())
      `)

      return NextResponse.json(result.recordset[0], { status: 201 })
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  } catch (error) {
    console.error("Tasks API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(handler)
export const POST = requireAuth(handler)

