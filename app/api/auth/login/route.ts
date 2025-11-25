import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getConnection, query } from "@/lib/db/connection"
import { generateToken } from "@/lib/auth/jwt"
import { ensureDatabaseInitialized } from "@/lib/db/middleware"

export async function POST(request: NextRequest) {
  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized()

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    const result = await query<{
      id: number
      email: string
      password_hash: string
      first_name: string
      last_name: string
      employee_id: string
      role_id: number
      role_name: string
      is_active: boolean
    }>(
      `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.employee_id, 
              u.role_id, r.name as role_name, u.is_active 
       FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       WHERE u.email = @email`,
      { email }
    )

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    const user = result[0]

    if (!user.is_active) {
      return NextResponse.json(
        { error: "Account is inactive" },
        { status: 403 }
      )
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      roleId: user.role_id,
      employeeId: user.employee_id,
    })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        employeeId: user.employee_id,
        roleId: user.role_id,
        roleName: user.role_name,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
