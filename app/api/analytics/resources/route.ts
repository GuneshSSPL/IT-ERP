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

    // Employee utilization by role
    const utilizationRequest = pool.request()
    const utilizationResult = await utilizationRequest.query(`
      SELECT 
        r.name as role_name,
        COUNT(DISTINCT u.id) as employee_count,
        AVG(pa.allocation_percentage) as avg_allocation,
        SUM(CASE WHEN pa.allocation_percentage > 100 THEN 1 ELSE 0 END) as overallocated_count
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      LEFT JOIN project_assignments pa ON u.id = pa.user_id
      WHERE u.is_active = 1
      GROUP BY r.name
    `)

    // Skill demand vs supply
    const skillsRequest = pool.request()
    const skillsResult = await skillsRequest.query(`
      SELECT 
        s.name,
        s.category,
        (SELECT COUNT(*) FROM project_skills_required psr WHERE psr.skill_id = s.id) as demand,
        (SELECT COUNT(*) FROM user_skills us WHERE us.skill_id = s.id) as supply
      FROM skills s
      ORDER BY demand DESC
    `)

    // Overallocation warnings
    const overallocationRequest = pool.request()
    const overallocationResult = await overallocationRequest.query(`
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        SUM(pa.allocation_percentage) as total_allocation
      FROM users u
      INNER JOIN project_assignments pa ON u.id = pa.user_id
      WHERE u.is_active = 1
      GROUP BY u.id, u.first_name, u.last_name
      HAVING SUM(pa.allocation_percentage) > 100
      ORDER BY total_allocation DESC
    `)

    return NextResponse.json({
      utilizationByRole: utilizationResult.recordset,
      skillDemandSupply: skillsResult.recordset,
      overallocatedEmployees: overallocationResult.recordset,
    })
  } catch (error) {
    console.error("Resource analytics error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(handler)

