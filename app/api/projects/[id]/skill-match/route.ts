import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/middleware"
import { getConnection } from "@/lib/db/connection"
import sql from "mssql"
import { findBestMatches, type EmployeeSkill, type ProjectSkill } from "@/lib/utils/skillMatching"

async function handler(
  req: NextRequest,
  user: { userId: number; email: string; roleId: number; employeeId: string },
  context?: { params?: Promise<{ id: string }> }
) {
  try {
    if (!context?.params) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    const { id } = await context.params
    const projectId = parseInt(id)

    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
    }

    const pool = await getConnection()

    if (req.method === "GET") {
      // Get project required skills
      const projectSkillsRequest = pool.request()
      projectSkillsRequest.input("projectId", sql.Int, projectId)
      const projectSkillsResult = await projectSkillsRequest.query(`
        SELECT 
          psr.skill_id,
          s.name as skill_name,
          psr.required_level,
          psr.priority
        FROM project_skills_required psr
        INNER JOIN skills s ON psr.skill_id = s.id
        WHERE psr.project_id = @projectId
      `)

      if (projectSkillsResult.recordset.length === 0) {
        return NextResponse.json({
          matches: [],
          message: "No skills required for this project",
        })
      }

      const projectSkills: ProjectSkill[] = projectSkillsResult.recordset.map((row: any) => ({
        skill_id: row.skill_id,
        skill_name: row.skill_name,
        required_level: row.required_level,
        priority: row.priority,
      }))

      // Get all active employees with their skills
      const employeesRequest = pool.request()
      const employeesResult = await employeesRequest.query(`
        SELECT 
          u.id,
          CONCAT(u.first_name, ' ', u.last_name) as name,
          u.is_active
        FROM users u
        WHERE u.is_active = 1
      `)

      // Get skills for each employee
      const employeesWithSkills = await Promise.all(
        employeesResult.recordset.map(async (employee: any) => {
          const skillsRequest = pool.request()
          skillsRequest.input("userId", sql.Int, employee.id)
          const skillsResult = await skillsRequest.query(`
            SELECT 
              us.skill_id,
              s.name as skill_name,
              us.proficiency_level,
              us.years_experience,
              us.certified
            FROM user_skills us
            INNER JOIN skills s ON us.skill_id = s.id
            WHERE us.user_id = @userId
          `)

          return {
            id: employee.id,
            name: employee.name,
            skills: skillsResult.recordset.map((row: any) => ({
              skill_id: row.skill_id,
              skill_name: row.skill_name,
              proficiency_level: row.proficiency_level,
              years_experience: row.years_experience,
              certified: row.certified,
            })) as EmployeeSkill[],
          }
        })
      )

      // Find best matches
      const matches = findBestMatches(employeesWithSkills, projectSkills, 10)

      return NextResponse.json({
        matches,
        projectSkills,
      })
    }

    if (req.method === "POST") {
      // Auto-assign team based on skill matching
      const body = await req.json()
      const { employeeIds } = body

      if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
        return NextResponse.json(
          { error: "Employee IDs array required" },
          { status: 400 }
        )
      }

      // Assign employees to project
      const tx = new sql.Transaction(pool)
      await tx.begin()

      try {
        for (const employeeId of employeeIds) {
          const assignRequest = tx.request()
          assignRequest.input("projectId", sql.Int, projectId)
          assignRequest.input("userId", sql.Int, employeeId)
          assignRequest.input("role", sql.NVarChar, "Developer")
          assignRequest.input("allocation", sql.Int, 50)

          await assignRequest.query(`
            IF NOT EXISTS (SELECT * FROM project_assignments 
                          WHERE project_id = @projectId AND user_id = @userId)
            BEGIN
              INSERT INTO project_assignments (project_id, user_id, role, allocation_percentage, 
                                              start_date, created_at, updated_at)
              VALUES (@projectId, @userId, @role, @allocation, GETDATE(), GETDATE(), GETDATE())
            END
          `)
        }

        await tx.commit()

        return NextResponse.json({
          success: true,
          message: `Assigned ${employeeIds.length} employees to project`,
        })
      } catch (error) {
        await tx.rollback()
        throw error
      }
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  } catch (error) {
    console.error("Skill match error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(handler)
export const POST = requireAuth(handler)

