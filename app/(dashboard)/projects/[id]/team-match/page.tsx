"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Users, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"

interface MatchResult {
  employeeId: number
  employeeName: string
  matchScore: number
  matchedSkills: string[]
  missingSkills: string[]
  skillGaps: Array<{ skill: string; required: string; available: string }>
  reasoning: string
}

export default function TeamMatchPage() {
  const params = useParams()
  const router = useRouter()
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [projectSkills, setProjectSkills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  if (!params?.id) {
    return <div>Invalid project ID</div>
  }

  useEffect(() => {
    if (params?.id) {
      fetchSkillMatches()
    }
  }, [params?.id])

  const fetchSkillMatches = async () => {
    if (!params?.id) return
    
    try {
      const { getStoredToken } = await import("@/lib/utils/storage")
      const token = getStoredToken()

      if (!token) {
        throw new Error("No authentication token")
      }

      const response = await fetch(`/api/projects/${params.id}/skill-match`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch skill matches")
      }

      const data = await response.json()
      setMatches(data.matches || [])
      setProjectSkills(data.projectSkills || [])
      setLoading(false)
    } catch (error) {
      console.error("Error fetching skill matches:", error)
      setLoading(false)
    }
  }

  const handleAssign = async () => {
    if (selected.size === 0 || !params?.id) return

    try {
      const { getStoredToken } = await import("@/lib/utils/storage")
      const token = getStoredToken()

      const response = await fetch(`/api/projects/${params.id}/skill-match`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeIds: Array.from(selected),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to assign employees")
      }

      if (params?.id) {
        router.push(`/projects/${params.id}`)
      }
    } catch (error) {
      console.error("Error assigning employees:", error)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  if (loading) {
    return <div>Loading skill matches...</div>
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => params?.id && router.push(`/projects/${params.id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Skill Matching</h1>
            <p className="text-sm text-muted-foreground">
              Find best team members for this project
            </p>
          </div>
        </div>
        {selected.size > 0 && (
          <Button onClick={handleAssign}>
            Assign {selected.size} Employee{selected.size > 1 ? "s" : ""}
          </Button>
        )}
      </div>

      {projectSkills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Required Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {projectSkills.map((skill) => (
                <Badge key={skill.skill_id} variant="outline">
                  {skill.skill_name} ({skill.required_level})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {matches.map((match) => (
          <Card
            key={match.employeeId}
            className={`cursor-pointer transition-all ${
              selected.has(match.employeeId) ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => {
              const newSelected = new Set(selected)
              if (newSelected.has(match.employeeId)) {
                newSelected.delete(match.employeeId)
              } else {
                newSelected.add(match.employeeId)
              }
              setSelected(newSelected)
            }}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{match.employeeName}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{match.reasoning}</p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getScoreColor(match.matchScore)}`}>
                    {match.matchScore}%
                  </div>
                  <Progress value={match.matchScore} className="w-24 mt-2" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {match.matchedSkills.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Matched Skills ({match.matchedSkills.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {match.matchedSkills.map((skill, i) => (
                      <Badge key={i} variant="outline" className="bg-green-50">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {match.missingSkills.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    Missing Skills ({match.missingSkills.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {match.missingSkills.map((skill, i) => (
                      <Badge key={i} variant="outline" className="bg-red-50">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {match.skillGaps.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Skill Gaps ({match.skillGaps.length})
                  </div>
                  <div className="space-y-1">
                    {match.skillGaps.map((gap, i) => (
                      <div key={i} className="text-xs text-muted-foreground">
                        {gap.skill}: Requires {gap.required}, has {gap.available}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

