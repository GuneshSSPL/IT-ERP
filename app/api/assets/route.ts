import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/middleware"
import { query, getConnection } from "@/lib/db/connection"

async function handler(
  req: NextRequest,
  user: { userId: number; email: string; roleId: number; employeeId: string }
) {
  try {
    if (req.method === "GET") {
      const assets = await query<{
        id: number
        name: string
        type: string
        category: string | null
        serial_number: string | null
        manufacturer: string | null
        model: string | null
        purchase_date: string | null
        purchase_cost: number | null
        assigned_to: number | null
        status: string
        location: string | null
        warranty_expiry: string | null
        assigned_to_name: string | null
      }>(
        `SELECT a.id, a.name, a.type, a.category, a.serial_number, a.manufacturer, 
         a.model, a.purchase_date, a.purchase_cost, a.assigned_to, a.status, 
         a.location, a.warranty_expiry,
         u.first_name + ' ' + u.last_name as assigned_to_name
         FROM assets a
         LEFT JOIN users u ON a.assigned_to = u.id
         ORDER BY a.created_at DESC`
      )

      return NextResponse.json(assets)
    }

    if (req.method === "POST") {
      const body = await req.json()
      const {
        name,
        type,
        category,
        serialNumber,
        manufacturer,
        model,
        purchaseDate,
        purchaseCost,
        assignedTo,
        status = "available",
        location,
        warrantyExpiry,
      } = body

      if (!name || !type) {
        return NextResponse.json(
          { error: "Name and type are required" },
          { status: 400 }
        )
      }

      const pool = await getConnection()
      const request = pool.request()
      request.input("name", name)
      request.input("type", type)
      request.input("category", category || null)
      request.input("serial_number", serialNumber || null)
      request.input("manufacturer", manufacturer || null)
      request.input("model", model || null)
      request.input("purchase_date", purchaseDate || null)
      request.input("purchase_cost", purchaseCost || null)
      request.input("assigned_to", assignedTo || null)
      request.input("status", status)
      request.input("location", location || null)
      request.input("warranty_expiry", warrantyExpiry || null)

      const result = await request.query(`
        INSERT INTO assets (name, type, category, serial_number, manufacturer, model, 
                           purchase_date, purchase_cost, assigned_to, status, location, 
                           warranty_expiry, created_at, updated_at)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.status
        VALUES (@name, @type, @category, @serial_number, @manufacturer, @model, 
                @purchase_date, @purchase_cost, @assigned_to, @status, @location, 
                @warranty_expiry, GETDATE(), GETDATE())
      `)

      return NextResponse.json(result.recordset[0], { status: 201 })
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  } catch (error) {
    console.error("Assets API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(handler)
export const POST = requireAuth(handler)

