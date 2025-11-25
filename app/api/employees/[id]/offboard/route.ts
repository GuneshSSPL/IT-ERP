import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/middleware"
import { getConnection } from "@/lib/db/connection"
import sql from "mssql"

async function handler(
  req: NextRequest,
  user: { userId: number; email: string; roleId: number; employeeId: string },
  context?: { params?: Promise<{ id: string }> }
) {
  if (req.method === "GET") {
    try {
      if (!context?.params) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 })
      }
      const { id } = await context.params
      const employeeId = parseInt(id)

      const pool = await getConnection()
      const request = pool.request()
      request.input("employeeId", sql.Int, employeeId)

      // Get employee assets
      const assetsResult = await request.query(`
        SELECT * FROM assets WHERE assigned_to = @employeeId
      `)

      // Get employee projects
      const projectsResult = await request.query(`
        SELECT 
          p.id,
          p.name,
          pa.role,
          (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.assigned_to = @employeeId) as task_count
        FROM project_assignments pa
        INNER JOIN projects p ON pa.project_id = p.id
        WHERE pa.user_id = @employeeId
      `)

      // Get employee tasks
      const tasksResult = await request.query(`
        SELECT 
          t.id,
          t.title,
          t.status,
          p.name as project_name
        FROM tasks t
        INNER JOIN projects p ON t.project_id = p.id
        WHERE t.assigned_to = @employeeId
        AND t.status IN ('todo', 'in_progress', 'review')
      `)

      return NextResponse.json({
        assets: assetsResult.recordset,
        projects: projectsResult.recordset,
        tasks: tasksResult.recordset,
      })
    } catch (error) {
      console.error("Offboarding data error:", error)
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      )
    }
  }

  if (req.method === "POST") {
    try {
      if (!context?.params) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 })
      }
      const { id } = await context.params
      const employeeId = parseInt(id)
      const body = await req.json()
      const { reassignTasks, reassignProjects, revokeAssets } = body

      const pool = await getConnection()
      const tx = new sql.Transaction(pool)
      await tx.begin()

      try {
        // 1. Reassign tasks
        if (reassignTasks && Array.isArray(reassignTasks)) {
          for (const task of reassignTasks) {
            const taskRequest = tx.request()
            taskRequest.input("taskId", sql.Int, task.taskId)
            taskRequest.input("newUserId", sql.Int, task.newUserId)

            await taskRequest.query(`
              UPDATE tasks
              SET assigned_to = @newUserId, updated_at = GETDATE()
              WHERE id = @taskId
            `)
          }
        }

        // 2. Remove from projects
        if (reassignProjects) {
          const projectRequest = tx.request()
          projectRequest.input("employeeId", sql.Int, employeeId)

          await projectRequest.query(`
            DELETE FROM project_assignments
            WHERE user_id = @employeeId
          `)
        }

        // 3. Revoke assets
        if (revokeAssets) {
          const assetRequest = tx.request()
          assetRequest.input("employeeId", sql.Int, employeeId)

          await assetRequest.query(`
            UPDATE assets
            SET assigned_to = NULL, status = 'available', updated_at = GETDATE()
            WHERE assigned_to = @employeeId
          `)
        }

        // 4. Deactivate user
        const userRequest = tx.request()
        userRequest.input("employeeId", sql.Int, employeeId)

        await userRequest.query(`
          UPDATE users
          SET is_active = 0, updated_at = GETDATE()
          WHERE id = @employeeId
        `)

        await tx.commit()

        return NextResponse.json({
          success: true,
          message: "Employee offboarded successfully",
        })
      } catch (error) {
        await tx.rollback()
        throw error
      }
    } catch (error) {
      console.error("Offboarding error:", error)
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export const GET = requireAuth(handler)
export const POST = requireAuth(handler)

