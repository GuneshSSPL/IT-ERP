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

    // Get projects where user is assigned
    const projectsRequest = pool.request()
    projectsRequest.input("userId", sql.Int, user.userId)
    const projectsResult = await projectsRequest.query(`
      SELECT 
        p.*,
        c.name as client_name,
        c.email as client_email
      FROM projects p
      INNER JOIN project_assignments pa ON p.id = pa.project_id
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE pa.user_id = @userId
      ORDER BY p.created_at DESC
    `)

    // Get client contacts
    const contactsRequest = pool.request()
    const contactsResult = await contactsRequest.query(`
      SELECT 
        cc.*,
        c.name as client_name
      FROM client_contacts cc
      INNER JOIN clients c ON cc.client_id = c.id
      WHERE cc.is_primary = 1
      ORDER BY c.name
    `)

    return NextResponse.json({
      projects: projectsResult.recordset,
      clientContacts: contactsResult.recordset,
    })
  } catch (error) {
    console.error("Analyst dashboard error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(handler)

