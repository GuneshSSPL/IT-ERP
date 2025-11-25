import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/middleware"
import { getConnection } from "@/lib/db/connection"
import sql from "mssql"

async function handler(
  req: NextRequest,
  user: { userId: number; email: string; roleId: number; employeeId: string },
  context?: { params?: Promise<{ id: string }> }
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
    const { managerId, type } = body // type: 'project' or 'account'

    if (isNaN(projectId) || !managerId || !type) {
      return NextResponse.json(
        { error: "Project ID, manager ID, and type are required" },
        { status: 400 }
      )
    }

    const pool = await getConnection()
    const request = pool.request()
    request.input("projectId", sql.Int, projectId)
    request.input("managerId", sql.Int, managerId)

    if (type === "project") {
      await request.query(`
        UPDATE projects
        SET project_manager_id = @managerId, updated_at = GETDATE()
        WHERE id = @projectId
      `)
    } else if (type === "account") {
      // Update client's account manager
      await request.query(`
        UPDATE clients
        SET account_manager_id = @managerId, updated_at = GETDATE()
        WHERE id = (SELECT client_id FROM projects WHERE id = @projectId)
      `)
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }

    // Log activity
    const activityRequest = pool.request()
    activityRequest.input("projectId", sql.Int, projectId)
    activityRequest.input("userId", sql.Int, user.userId)
    activityRequest.input("action", sql.NVarChar, `${type}_manager_assigned`)
    activityRequest.input("description", sql.NVarChar, `Manager assigned to project`)

    await activityRequest.query(`
      INSERT INTO activity_logs (project_id, user_id, action, description, created_at)
      VALUES (@projectId, @userId, @action, @description, GETDATE())
    `)

    return NextResponse.json({
      success: true,
      message: `${type === "project" ? "Project" : "Account"} manager assigned successfully`,
    })
  } catch (error) {
    console.error("Manager assignment error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const POST = requireAuth(handler)

