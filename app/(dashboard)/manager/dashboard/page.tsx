"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FolderKanban, Users, Clock, AlertTriangle } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"

export default function ManagerDashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchManagerData()
  }, [])

  const fetchManagerData = async () => {
    try {
      const { getStoredToken } = await import("@/lib/utils/storage")
      const token = getStoredToken()

      if (!token) {
        throw new Error("No authentication token")
      }

      const response = await fetch("/api/manager/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch manager data")
      }

      const managerData = await response.json()
      setData(managerData)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching manager data:", error)
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading manager dashboard...</div>
  }

  if (!data) {
    return <div>Error loading dashboard</div>
  }

  const { projects, teamWorkload } = data

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Project Manager Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage your projects and team
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Managed Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">Active projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamWorkload.length}</div>
            <p className="text-xs text-muted-foreground">Assigned team</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(projects.reduce((sum: number, p: any) => sum + (p.total_hours || 0), 0))}h
            </div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projects.map((project: any) => {
                const taskProgress = project.total_tasks > 0
                  ? (project.completed_tasks / project.total_tasks) * 100
                  : 0
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-xs text-muted-foreground">{project.client_name}</div>
                      </div>
                      <Badge variant="outline">{project.status}</Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Tasks: {project.completed_tasks}/{project.total_tasks}</span>
                        <span>{Math.round(taskProgress)}%</span>
                      </div>
                      <Progress value={taskProgress} className="h-2" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Workload</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamWorkload.map((member: any) => {
                const isOverallocated = member.total_allocation > 100
                return (
                  <div key={member.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{member.name}</span>
                      <div className="flex items-center gap-2">
                        {isOverallocated && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                        <span className={`text-sm font-medium ${isOverallocated ? "text-destructive" : ""}`}>
                          {member.total_allocation}%
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={Math.min(member.total_allocation, 100)}
                      className="h-2"
                    />
                    <div className="text-xs text-muted-foreground">
                      {member.project_count} project(s)
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

