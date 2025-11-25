"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  FolderKanban,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Award,
} from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      const { getStoredToken } = await import("@/lib/utils/storage")
      const token = getStoredToken()

      if (!token) {
        throw new Error("No authentication token")
      }

      const response = await fetch("/api/admin/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch admin data")
      }

      const adminData = await response.json()
      setData(adminData)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching admin data:", error)
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading admin dashboard...</div>
  }

  if (!data) {
    return <div>Error loading dashboard</div>
  }

  const { overview, financial, resources, projectHealth, topPerformers } = data
  const totalVariance = financial.reduce((sum: number, p: any) => sum + (p.variance || 0), 0)
  const budgetUsage = overview.total_revenue > 0
    ? (overview.total_actual_cost / overview.total_revenue) * 100
    : 0

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Company overview and analytics
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.total_employees}</div>
            <p className="text-xs text-muted-foreground">Active team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.active_projects}</div>
            <p className="text-xs text-muted-foreground">Projects in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(overview.total_revenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(overview.total_actual_cost || 0)} spent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(budgetUsage)}%</div>
            <Progress value={budgetUsage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Financial Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {financial.slice(0, 5).map((project: any) => (
                <div key={project.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{project.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Budget: {formatCurrency(project.budget || 0)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatCurrency(project.actual_cost || 0)}
                    </div>
                    <div className={`text-xs ${project.variance < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {formatCurrency(project.variance || 0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resource Utilization */}
        <Card>
          <CardHeader>
            <CardTitle>Resource Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {resources.slice(0, 5).map((resource: any) => {
                const isOverallocated = resource.total_allocation > 100
                return (
                  <div key={resource.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{resource.name}</span>
                      <div className="flex items-center gap-2">
                        {isOverallocated && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                        <span className={`text-sm font-medium ${isOverallocated ? "text-destructive" : ""}`}>
                          {resource.total_allocation}%
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={Math.min(resource.total_allocation, 100)}
                      className="h-2"
                    />
                    <div className="text-xs text-muted-foreground">
                      {resource.project_count} project(s)
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Project Health */}
        <Card>
          <CardHeader>
            <CardTitle>Projects at Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projectHealth.map((project: any) => {
                const isOverdue = project.end_date && new Date(project.end_date) < new Date()
                const isOverBudget = project.budget && project.actual_cost > project.budget
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{project.name}</span>
                          {isOverdue && (
                            <Badge variant="destructive" className="text-xs">
                              Overdue
                            </Badge>
                          )}
                          {isOverBudget && (
                            <Badge variant="destructive" className="text-xs">
                              Over Budget
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {project.overdue_tasks} overdue tasks
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.map((performer: any, index: number) => (
                <div key={performer.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{performer.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {performer.tasks_completed} tasks • {Math.round(performer.hours_logged)}h
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

