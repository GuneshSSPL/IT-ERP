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

    // Project success rate
    const successRequest = pool.request()
    const successResult = await successRequest.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM projects
    `)

    // Average project duration
    const durationRequest = pool.request()
    const durationResult = await durationRequest.query(`
      SELECT 
        AVG(DATEDIFF(day, start_date, end_date)) as avg_duration
      FROM projects
      WHERE start_date IS NOT NULL AND end_date IS NOT NULL AND status = 'completed'
    `)

    // Budget variance
    const varianceRequest = pool.request()
    const varianceResult = await varianceRequest.query(`
      SELECT 
        AVG(CASE WHEN budget > 0 THEN ((actual_cost - budget) / budget * 100) ELSE 0 END) as avg_variance
      FROM projects
      WHERE budget IS NOT NULL AND actual_cost IS NOT NULL
    `)

    // Resource utilization
    const utilizationRequest = pool.request()
    const utilizationResult = await utilizationRequest.query(`
      SELECT 
        AVG(allocation_percentage) as avg_utilization,
        COUNT(*) as total_assignments
      FROM project_assignments
    `)

    const success = successResult.recordset[0]
    const successRate = success.total > 0
      ? (success.completed / success.total) * 100
      : 0

    return NextResponse.json({
      successRate: Math.round(successRate),
      avgDuration: Math.round(durationResult.recordset[0]?.avg_duration || 0),
      avgVariance: Math.round(varianceResult.recordset[0]?.avg_variance || 0),
      avgUtilization: Math.round(utilizationResult.recordset[0]?.avg_utilization || 0),
      totalProjects: success.total,
      completedProjects: success.completed,
      cancelledProjects: success.cancelled,
    })
  } catch (error) {
    console.error("Project analytics error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(handler)

