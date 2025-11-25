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

    // Employee directory
    const employeesRequest = pool.request()
    const employeesResult = await employeesRequest.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.employee_id,
        u.is_active,
        u.hire_date,
        d.name as department_name,
        r.name as role_name,
        (SELECT COUNT(*) FROM project_assignments pa WHERE pa.user_id = u.id) as project_count
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `)

    // Leave requests
    const leaveRequest = pool.request()
    const leaveResult = await leaveRequest.query(`
      SELECT 
        lr.*,
        CONCAT(u.first_name, ' ', u.last_name) as employee_name
      FROM leave_requests lr
      INNER JOIN users u ON lr.user_id = u.id
      WHERE lr.status = 'pending'
      ORDER BY lr.start_date ASC
    `)

    // Skills inventory
    const skillsRequest = pool.request()
    const skillsResult = await skillsRequest.query(`
      SELECT 
        s.name,
        s.category,
        COUNT(DISTINCT us.user_id) as employee_count
      FROM skills s
      LEFT JOIN user_skills us ON s.id = us.skill_id
      GROUP BY s.name, s.category
      ORDER BY employee_count DESC
    `)

    return NextResponse.json({
      employees: employeesResult.recordset,
      leaveRequests: leaveResult.recordset,
      skillsInventory: skillsResult.recordset,
    })
  } catch (error) {
    console.error("HR dashboard error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(handler)

