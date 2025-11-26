import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/middleware"
import { getConnection } from "@/lib/db/connection"
import sql from "mssql"

async function handler(
  req: NextRequest,
  user: { userId: number; email: string; roleId: number; employeeId: string },
  context?: { params?: Promise<Record<string, string>> }
) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    if (!context?.params) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    const { id } = await context.params
    const projectId = parseInt(id)
    const body = await req.json()
    const { status } = body

    if (isNaN(projectId) || !status) {
      return NextResponse.json(
        { error: "Project ID and status are required" },
        { status: 400 }
      )
    }

    const validStatuses = ["planning", "in_progress", "on_hold", "completed", "cancelled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    const pool = await getConnection()
    const request = pool.request()
    request.input("projectId", sql.Int, projectId)
    request.input("status", sql.NVarChar, status)

    // Get old status
    const oldStatusResult = await request.query(`
      SELECT status FROM projects WHERE id = @projectId
    `)

    if (oldStatusResult.recordset.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const oldStatus = oldStatusResult.recordset[0].status

    // Update status
    await request.query(`
      UPDATE projects
      SET status = @status, updated_at = GETDATE()
      WHERE id = @projectId
    `)

    // Log activity
    const activityRequest = pool.request()
    activityRequest.input("projectId", sql.Int, projectId)
    activityRequest.input("userId", sql.Int, user.userId)
    activityRequest.input("action", sql.NVarChar, "status_changed")
    activityRequest.input("description", sql.NVarChar, `Status changed from ${oldStatus} to ${status}`)

    await activityRequest.query(`
      INSERT INTO activity_logs (project_id, user_id, action, description, created_at)
      VALUES (@projectId, @userId, @action, @description, GETDATE())
    `)

    return NextResponse.json({
      success: true,
      message: "Project status updated successfully",
    })
  } catch (error) {
    console.error("Status update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const POST = requireAuth(handler)

