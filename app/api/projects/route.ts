import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/middleware"
import { query, getConnection } from "@/lib/db/connection"

async function handler(
  req: NextRequest,
  user: { userId: number; email: string; roleId: number; employeeId: string }
) {
  try {
    if (req.method === "GET") {
      const projects = await query<{
        id: number
        name: string
        code: string
        client_id: number
        project_manager_id: number
        status: string
        priority: string
        start_date: string | null
        end_date: string | null
        budget: number | null
        actual_cost: number | null
      }>(
        `SELECT id, name, code, client_id, project_manager_id, status, priority, 
         start_date, end_date, budget, actual_cost
         FROM projects
         ORDER BY created_at DESC`
      )

      return NextResponse.json(projects)
    }

    if (req.method === "POST") {
      const body = await req.json()
      const {
        name,
        code,
        clientId,
        projectManagerId,
        status = "planning",
        priority = "medium",
        startDate,
        endDate,
        budget,
        description,
      } = body

      if (!name || !code || !clientId || !projectManagerId) {
        return NextResponse.json(
          { error: "Required fields are missing" },
          { status: 400 }
        )
      }

      const pool = await getConnection()
      const request = pool.request()
      request.input("name", name)
      request.input("code", code)
      request.input("client_id", clientId)
      request.input("project_manager_id", projectManagerId)
      request.input("status", status)
      request.input("priority", priority)
      request.input("start_date", startDate || null)
      request.input("end_date", endDate || null)
      request.input("budget", budget || null)
      request.input("description", description || null)

      const result = await request.query(`
        INSERT INTO projects (name, code, client_id, project_manager_id, status, priority, 
                              start_date, end_date, budget, actual_cost, description, created_at, updated_at)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.code, INSERTED.status
        VALUES (@name, @code, @client_id, @project_manager_id, @status, @priority, 
                @start_date, @end_date, @budget, 0, @description, GETDATE(), GETDATE())
      `)

      return NextResponse.json(result.recordset[0], { status: 201 })
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  } catch (error) {
    console.error("Projects API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(handler)
export const POST = requireAuth(handler)

