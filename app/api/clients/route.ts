import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/middleware"
import { query, getConnection } from "@/lib/db/connection"

async function handler(
  req: NextRequest,
  user: { userId: number; email: string; roleId: number; employeeId: string }
) {
  try {
    if (req.method === "GET") {
      const clients = await query<{
        id: number
        name: string
        industry: string | null
        website: string | null
        phone: string | null
        email: string | null
        status: string
        account_manager_id: number | null
        account_manager_name: string | null
      }>(
        `SELECT c.id, c.name, c.industry, c.website, c.phone, c.email, c.status,
         c.account_manager_id, u.first_name + ' ' + u.last_name as account_manager_name
         FROM clients c
         LEFT JOIN users u ON c.account_manager_id = u.id
         ORDER BY c.created_at DESC`
      )

      return NextResponse.json(clients)
    }

    if (req.method === "POST") {
      const body = await req.json()
      const {
        name,
        industry,
        website,
        phone,
        email,
        address,
        status = "active",
        accountManagerId,
      } = body

      if (!name) {
        return NextResponse.json(
          { error: "Client name is required" },
          { status: 400 }
        )
      }

      const pool = await getConnection()
      const request = pool.request()
      request.input("name", name)
      request.input("industry", industry || null)
      request.input("website", website || null)
      request.input("phone", phone || null)
      request.input("email", email || null)
      request.input("address", address || null)
      request.input("status", status)
      request.input("account_manager_id", accountManagerId || null)

      const result = await request.query(`
        INSERT INTO clients (name, industry, website, phone, email, address, status, 
                            account_manager_id, created_at, updated_at)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.status
        VALUES (@name, @industry, @website, @phone, @email, @address, @status, 
                @account_manager_id, GETDATE(), GETDATE())
      `)

      return NextResponse.json(result.recordset[0], { status: 201 })
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  } catch (error) {
    console.error("Clients API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(handler)
export const POST = requireAuth(handler)

