/**
 * Skill Matching Algorithm
 * Matches employees to projects based on required vs available skills
 */

export interface Skill {
  id: number
  name: string
  category: string
}

export interface EmployeeSkill {
  skill_id: number
  skill_name: string
  proficiency_level: string
  years_experience: number
  certified: boolean
}

export interface ProjectSkill {
  skill_id: number
  skill_name: string
  required_level: string
  priority: string
}

export interface MatchResult {
  employeeId: number
  employeeName: string
  matchScore: number
  matchedSkills: string[]
  missingSkills: string[]
  skillGaps: Array<{
    skill: string
    required: string
    available: string
  }>
  reasoning: string
}

/**
 * Calculate skill match score between employee and project
 */
export function calculateSkillMatch(
  employeeSkills: EmployeeSkill[],
  projectSkills: ProjectSkill[]
): {
  matchScore: number
  matchedSkills: string[]
  missingSkills: string[]
  skillGaps: Array<{ skill: string; required: string; available: string }>
} {
  if (projectSkills.length === 0) {
    return {
      matchScore: 100,
      matchedSkills: [],
      missingSkills: [],
      skillGaps: [],
    }
  }

  const employeeSkillMap = new Map<number, EmployeeSkill>()
  employeeSkills.forEach((skill) => {
    employeeSkillMap.set(skill.skill_id, skill)
  })

  const matchedSkills: string[] = []
  const missingSkills: string[] = []
  const skillGaps: Array<{ skill: string; required: string; available: string }> = []

  let totalScore = 0
  let maxScore = 0

  projectSkills.forEach((projectSkill) => {
    const employeeSkill = employeeSkillMap.get(projectSkill.skill_id)
    maxScore += getSkillPriorityWeight(projectSkill.priority)

    if (employeeSkill) {
      matchedSkills.push(projectSkill.skill_name)
      const skillScore = calculateSkillScore(
        employeeSkill.proficiency_level,
        projectSkill.required_level,
        projectSkill.priority,
        employeeSkill.certified,
        employeeSkill.years_experience
      )
      totalScore += skillScore

      // Check if there's a skill gap
      if (isSkillGap(employeeSkill.proficiency_level, projectSkill.required_level)) {
        skillGaps.push({
          skill: projectSkill.skill_name,
          required: projectSkill.required_level,
          available: employeeSkill.proficiency_level,
        })
      }
    } else {
      missingSkills.push(projectSkill.skill_name)
    }
  })

  const matchScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

  return {
    matchScore,
    matchedSkills,
    missingSkills,
    skillGaps,
  }
}

/**
 * Get priority weight for skill matching
 */
function getSkillPriorityWeight(priority: string): number {
  const weights: Record<string, number> = {
    required: 3,
    preferred: 2,
    nice_to_have: 1,
  }
  return weights[priority.toLowerCase()] || 1
}

/**
 * Calculate score for a single skill match
 */
function calculateSkillScore(
  employeeLevel: string,
  requiredLevel: string,
  priority: string,
  certified: boolean,
  yearsExperience: number
): number {
  const baseWeight = getSkillPriorityWeight(priority)
  let score = 0

  const levelHierarchy: Record<string, number> = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
    expert: 4,
  }

  const employeeLevelNum = levelHierarchy[employeeLevel.toLowerCase()] || 0
  const requiredLevelNum = levelHierarchy[requiredLevel.toLowerCase()] || 0

  if (employeeLevelNum >= requiredLevelNum) {
    // Employee meets or exceeds requirement
    score = baseWeight * 1.0
    if (employeeLevelNum > requiredLevelNum) {
      score *= 1.1 // Bonus for exceeding requirement
    }
  } else {
    // Employee is below requirement
    const gap = requiredLevelNum - employeeLevelNum
    score = baseWeight * (1.0 - gap * 0.3) // Penalty for gap
    score = Math.max(0, score) // Don't go negative
  }

  // Bonus for certification
  if (certified) {
    score *= 1.05
  }

  // Bonus for experience
  if (yearsExperience >= 3) {
    score *= 1.05
  } else if (yearsExperience >= 5) {
    score *= 1.1
  }

  return score
}

/**
 * Check if there's a skill gap
 */
function isSkillGap(employeeLevel: string, requiredLevel: string): boolean {
  const levelHierarchy: Record<string, number> = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
    expert: 4,
  }

  const employeeLevelNum = levelHierarchy[employeeLevel.toLowerCase()] || 0
  const requiredLevelNum = levelHierarchy[requiredLevel.toLowerCase()] || 0

  return employeeLevelNum < requiredLevelNum
}

/**
 * Generate match reasoning
 */
export function generateMatchReasoning(
  matchScore: number,
  matchedSkills: string[],
  missingSkills: string[],
  skillGaps: Array<{ skill: string; required: string; available: string }>
): string {
  if (matchScore >= 90) {
    return `Excellent match! Employee has ${matchedSkills.length} required skills and meets all requirements.`
  } else if (matchScore >= 70) {
    return `Good match. Employee has ${matchedSkills.length} required skills but is missing ${missingSkills.length} skills.`
  } else if (matchScore >= 50) {
    return `Moderate match. Employee has ${matchedSkills.length} required skills but missing ${missingSkills.length} critical skills.`
  } else {
    return `Weak match. Employee only has ${matchedSkills.length} required skills and is missing ${missingSkills.length} skills.`
  }
}

/**
 * Find best matching employees for a project
 */
export function findBestMatches(
  employees: Array<{
    id: number
    name: string
    skills: EmployeeSkill[]
  }>,
  projectSkills: ProjectSkill[],
  limit: number = 10
): MatchResult[] {
  const matches: MatchResult[] = []

  employees.forEach((employee) => {
    const match = calculateSkillMatch(employee.skills, projectSkills)
    const reasoning = generateMatchReasoning(
      match.matchScore,
      match.matchedSkills,
      match.missingSkills,
      match.skillGaps
    )

    matches.push({
      employeeId: employee.id,
      employeeName: employee.name,
      matchScore: match.matchScore,
      matchedSkills: match.matchedSkills,
      missingSkills: match.missingSkills,
      skillGaps: match.skillGaps,
      reasoning,
    })
  })

  // Sort by match score descending
  matches.sort((a, b) => b.matchScore - a.matchScore)

  return matches.slice(0, limit)
}

