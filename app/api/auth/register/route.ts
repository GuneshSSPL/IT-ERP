import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getConnection, query } from "@/lib/db/connection"
import { generateToken } from "@/lib/auth/jwt"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      password,
      firstName,
      lastName,
      employeeId,
      phone,
      departmentId,
      roleId = 3, // Default to employee role
    } = body

    if (!email || !password || !firstName || !lastName || !employeeId) {
      return NextResponse.json(
        { error: "Required fields are missing" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await query<{ id: number }>(
      "SELECT id FROM users WHERE email = @email",
      { email }
    )

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      )
    }

    // Check if employee ID already exists
    const existingEmployee = await query<{ id: number }>(
      "SELECT id FROM users WHERE employee_id = @employeeId",
      { employeeId }
    )

    if (existingEmployee.length > 0) {
      return NextResponse.json(
        { error: "Employee ID already exists" },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const pool = await getConnection()
    const dbRequest = pool.request()
    dbRequest.input("email", email)
    dbRequest.input("password_hash", passwordHash)
    dbRequest.input("first_name", firstName)
    dbRequest.input("last_name", lastName)
    dbRequest.input("employee_id", employeeId)
    dbRequest.input("phone", phone || null)
    dbRequest.input("department_id", departmentId || null)
    dbRequest.input("role_id", roleId)
    dbRequest.input("is_active", true)

    const result = await dbRequest.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, employee_id, phone, department_id, role_id, is_active, hire_date, created_at, updated_at)
      OUTPUT INSERTED.id, INSERTED.email, INSERTED.first_name, INSERTED.last_name, INSERTED.employee_id, INSERTED.role_id
      VALUES (@email, @password_hash, @first_name, @last_name, @employee_id, @phone, @department_id, @role_id, @is_active, GETDATE(), GETDATE(), GETDATE())
    `)

    const newUser = result.recordset[0]

    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      roleId: newUser.role_id,
      employeeId: newUser.employee_id,
    })

    return NextResponse.json(
      {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          employeeId: newUser.employee_id,
          roleId: newUser.role_id,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

