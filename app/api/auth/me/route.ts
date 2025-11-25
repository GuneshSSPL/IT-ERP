import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/middleware"
import { query } from "@/lib/db/connection"

async function handler(
  req: NextRequest,
  user: { userId: number; email: string; roleId: number; employeeId: string }
) {
  try {
    const result = await query<{
      id: number
      email: string
      first_name: string
      last_name: string
      employee_id: string
      role_id: number
      role_name: string
      department_id: number | null
      manager_id: number | null
      phone: string | null
    }>(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.employee_id, u.role_id, 
              r.name as role_name, u.department_id, u.manager_id, u.phone
       FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       WHERE u.id = @userId`,
      { userId: user.userId }
    )

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = result[0]

    return NextResponse.json({
      id: userData.id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      employeeId: userData.employee_id,
      roleId: userData.role_id,
      roleName: userData.role_name,
      departmentId: userData.department_id,
      managerId: userData.manager_id,
      phone: userData.phone,
    })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(handler)

