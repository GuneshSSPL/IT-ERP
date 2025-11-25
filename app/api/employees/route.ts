import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/middleware"
import { query, getConnection } from "@/lib/db/connection"

async function handler(
  req: NextRequest,
  user: { userId: number; email: string; roleId: number; employeeId: string }
) {
  try {
    if (req.method === "GET") {
      const employees = await query<{
        id: number
        email: string
        first_name: string
        last_name: string
        employee_id: string
        phone: string | null
        department_id: number | null
        manager_id: number | null
        role_id: number
        is_active: boolean
        hire_date: string | null
        department_name: string | null
        manager_name: string | null
      }>(
        `SELECT u.id, u.email, u.first_name, u.last_name, u.employee_id, u.phone,
         u.department_id, u.manager_id, u.role_id, u.is_active, u.hire_date,
         d.name as department_name,
         m.first_name + ' ' + m.last_name as manager_name
         FROM users u
         LEFT JOIN departments d ON u.department_id = d.id
         LEFT JOIN users m ON u.manager_id = m.id
         ORDER BY u.created_at DESC`
      )

      return NextResponse.json(employees)
    }

    if (req.method === "POST") {
      const body = await req.json()
      const {
        email,
        password,
        firstName,
        lastName,
        employeeId,
        phone,
        departmentId,
        managerId,
        roleId = 3, // Default to employee
      } = body

      if (!email || !password || !firstName || !lastName || !employeeId) {
        return NextResponse.json(
          { error: "Required fields are missing" },
          { status: 400 }
        )
      }

      // Check if email or employee ID already exists
      const existing = await query<{ id: number }>(
        `SELECT id FROM users WHERE email = @email OR employee_id = @employeeId`,
        { email, employeeId }
      )

      if (existing.length > 0) {
        return NextResponse.json(
          { error: "Email or Employee ID already exists" },
          { status: 400 }
        )
      }

      const bcrypt = (await import("bcryptjs")).default
      const passwordHash = await bcrypt.hash(password, 10)

      const pool = await getConnection()
      const request = pool.request()
      request.input("email", email)
      request.input("password_hash", passwordHash)
      request.input("first_name", firstName)
      request.input("last_name", lastName)
      request.input("employee_id", employeeId)
      request.input("phone", phone || null)
      request.input("department_id", departmentId || null)
      request.input("manager_id", managerId || null)
      request.input("role_id", roleId)
      request.input("is_active", true)

      const result = await request.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, employee_id, 
                          phone, department_id, manager_id, role_id, is_active, 
                          hire_date, created_at, updated_at)
        OUTPUT INSERTED.id, INSERTED.email, INSERTED.first_name, INSERTED.last_name, 
               INSERTED.employee_id
        VALUES (@email, @password_hash, @first_name, @last_name, @employee_id, 
                @phone, @department_id, @manager_id, @role_id, @is_active, 
                GETDATE(), GETDATE(), GETDATE())
      `)

      return NextResponse.json(result.recordset[0], { status: 201 })
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  } catch (error) {
    console.error("Employees API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(handler)
export const POST = requireAuth(handler)

