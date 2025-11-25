import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/middleware"
import { getConnection } from "@/lib/db/connection"
import sql from "mssql"

async function handler(
  req: NextRequest,
  user: { userId: number; email: string; roleId: number; employeeId: string }
) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    const body = await req.json()
    const {
      client,
      contacts,
      accountManagerId,
      project,
      projectManagerId,
    } = body

    if (!client || !client.name || !accountManagerId) {
      return NextResponse.json(
        { error: "Client name and account manager are required" },
        { status: 400 }
      )
    }

    const pool = await getConnection()
    const tx = new sql.Transaction(pool)
    await tx.begin()

    try {
      // 1. Create client
      const clientRequest = tx.request()
      clientRequest.input("name", client.name)
      clientRequest.input("industry", client.industry || null)
      clientRequest.input("website", client.website || null)
      clientRequest.input("phone", client.phone || null)
      clientRequest.input("email", client.email || null)
      clientRequest.input("address", client.address || null)
      clientRequest.input("accountManagerId", sql.Int, accountManagerId)

      const clientResult = await clientRequest.query(`
        INSERT INTO clients (name, industry, website, phone, email, address, status, 
                            account_manager_id, created_at, updated_at)
        OUTPUT INSERTED.id
        VALUES (@name, @industry, @website, @phone, @email, @address, 'active', 
                @accountManagerId, GETDATE(), GETDATE())
      `)

      const clientId = clientResult.recordset[0].id

      // 2. Add client contacts
      if (contacts && Array.isArray(contacts)) {
        for (const contact of contacts) {
          const contactRequest = tx.request()
          contactRequest.input("clientId", sql.Int, clientId)
          contactRequest.input("firstName", contact.first_name)
          contactRequest.input("lastName", contact.last_name)
          contactRequest.input("email", contact.email || null)
          contactRequest.input("phone", contact.phone || null)
          contactRequest.input("jobTitle", contact.job_title || null)
          contactRequest.input("isPrimary", contact.is_primary || false)

          await contactRequest.query(`
            INSERT INTO client_contacts (client_id, first_name, last_name, email, phone, 
                                        job_title, is_primary, created_at, updated_at)
            VALUES (@clientId, @firstName, @lastName, @email, @phone, 
                    @jobTitle, @isPrimary, GETDATE(), GETDATE())
          `)
        }
      }

      // 3. Create initial project if provided
      let projectId = null
      if (project && project.name && projectManagerId) {
        const projectRequest = tx.request()
        projectRequest.input("name", project.name)
        projectRequest.input("code", project.code || `PROJ-${Date.now()}`)
        projectRequest.input("clientId", sql.Int, clientId)
        projectRequest.input("projectManagerId", sql.Int, projectManagerId)
        projectRequest.input("status", project.status || "planning")
        projectRequest.input("priority", project.priority || "medium")
        projectRequest.input("startDate", project.start_date || null)
        projectRequest.input("endDate", project.end_date || null)
        projectRequest.input("budget", project.budget || null)
        projectRequest.input("description", project.description || null)

        const projectResult = await projectRequest.query(`
          INSERT INTO projects (name, code, client_id, project_manager_id, status, priority, 
                               start_date, end_date, budget, actual_cost, description, 
                               created_at, updated_at)
          OUTPUT INSERTED.id
          VALUES (@name, @code, @clientId, @projectManagerId, @status, @priority, 
                  @startDate, @endDate, @budget, 0, @description, GETDATE(), GETDATE())
        `)

        projectId = projectResult.recordset[0].id
      }

      await tx.commit()

      return NextResponse.json({
        success: true,
        clientId,
        projectId,
        message: "Client onboarded successfully",
      })
    } catch (error) {
      await tx.rollback()
      throw error
    }
  } catch (error) {
    console.error("Client onboarding error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const POST = requireAuth(handler)

