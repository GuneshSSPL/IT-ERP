"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"

interface ProjectDetail {
  project: any
  team: any[]
  phases: any[]
  tasks: any[]
  timeTracking: any
  activities: any[]
  healthScore: number
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)

  if (!params?.id) {
    return <div>Invalid project ID</div>
  }

  useEffect(() => {
    if (params?.id) {
      fetchProjectDetail()
    }
  }, [params?.id])

  const fetchProjectDetail = async () => {
    if (!params?.id) return
    
    try {
      const { getStoredToken } = await import("@/lib/utils/storage")
      const token = getStoredToken()

      if (!token) {
        throw new Error("No authentication token")
      }

      const response = await fetch(`/api/projects/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch project details")
      }

      const projectData = await response.json()
      setData(projectData)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching project details:", error)
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: "bg-blue-500",
      in_progress: "bg-yellow-500",
      on_hold: "bg-orange-500",
      completed: "bg-green-500",
      cancelled: "bg-red-500",
    }
    return colors[status] || "bg-gray-500"
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading project details...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-muted-foreground">Project not found</div>
        <Button onClick={() => router.push("/projects")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    )
  }

  const { project, team, phases, tasks, timeTracking, activities, healthScore } = data
  const totalTasks = tasks.reduce((sum, t) => sum + t.count, 0)
  const completedTasks = tasks.find((t) => t.status === "done")?.count || 0
  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
  const budgetUsage = project.budget && project.actual_cost
    ? (project.actual_cost / project.budget) * 100
    : 0

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/projects")}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{project.name}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {project.code} • {project.client_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => params?.id && router.push(`/projects/${params.id}/team-match`)}
          >
            <Users className="h-4 w-4 mr-2" />
            Skill Match
          </Button>
          <Badge className={`${getStatusColor(project.status)} text-white`}>
            {project.status.replace("_", " ").toUpperCase()}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {project.priority}
          </Badge>
        </div>
      </div>

      {/* Project Overview Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(healthScore)}`}>
              {Math.round(healthScore)}
            </div>
            <Progress value={healthScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(project.actual_cost || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              of {formatCurrency(project.budget || 0)} ({Math.round(budgetUsage)}%)
            </p>
            <Progress value={budgetUsage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedTasks}/{totalTasks}
            </div>
            <p className="text-xs text-muted-foreground">Tasks completed</p>
            <Progress value={taskProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Logged</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(timeTracking.total_hours || 0)}h
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round(timeTracking.billable_hours || 0)}h billable
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          {/* Project Phases */}
          <Card>
            <CardHeader>
              <CardTitle>Project Phases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {phases.map((phase) => (
                  <div key={phase.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{phase.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {phase.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(phase.start_date)} - {formatDate(phase.end_date)}
                      </span>
                    </div>
                    <Progress
                      value={
                        phase.status === "completed"
                          ? 100
                          : phase.status === "in_progress"
                          ? 50
                          : 0
                      }
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tasks Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Tasks Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm capitalize">{task.status.replace("_", " ")}</span>
                      <Badge variant="secondary">{task.count}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Math.round(task.total_actual || 0)}h / {Math.round(task.total_estimated || 0)}h
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-4">
          {/* Team Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {team.map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{member.allocation_percentage}%</p>
                      {member.hourly_rate && (
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(member.hourly_rate)}/hr
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Manager</span>
                <span className="font-medium">{project.manager_name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Start Date</span>
                <span>{formatDate(project.start_date)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">End Date</span>
                <span>{formatDate(project.end_date)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Client</span>
                <span className="font-medium">{project.client_name}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

