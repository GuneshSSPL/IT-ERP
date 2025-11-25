"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  FolderKanban,
  CheckSquare,
  Clock,
  TrendingUp,
  AlertCircle,
  Calendar,
  Target,
} from "lucide-react"
import { formatDate } from "@/lib/utils"

interface DashboardData {
  projects: any[]
  tasks: any[]
  timeTracking: any
  performance: any
  skills: any[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<number | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { getStoredUser } = await import("@/lib/utils/storage")
        const user = getStoredUser()
        if (user?.id) {
          setUserId(user.id)
          fetchDashboardData(user.id)
        }
      } catch (error) {
        console.error("Error loading user:", error)
        setLoading(false)
      }
    }
    loadUserData()
  }, [])

  const fetchDashboardData = async (id: number) => {
    try {
      const { getStoredToken } = await import("@/lib/utils/storage")
      const token = getStoredToken()
      
      if (!token) {
        throw new Error("No authentication token")
      }

      const response = await fetch(`/api/users/${id}/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch dashboard data: ${response.status}`)
      }

      const dashboardData = await response.json()
      setData(dashboardData)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setLoading(false)
      // Show error to user
      if (error instanceof Error) {
        console.error("Dashboard error details:", error.message)
      }
    }
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: "bg-red-500",
      high: "bg-orange-500",
      medium: "bg-yellow-500",
      low: "bg-blue-500",
    }
    return colors[priority] || "bg-gray-500"
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      todo: "bg-gray-500",
      in_progress: "bg-yellow-500",
      review: "bg-blue-500",
      done: "bg-green-500",
    }
    return colors[status] || "bg-gray-500"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    )
  }

  if (!data) {
    return <div>Error loading dashboard</div>
  }

  const { projects, tasks, timeTracking, performance, skills } = data
  const overdueTasks = tasks.filter(
    (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done"
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">My Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Overview of your projects, tasks, and performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">Active assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {overdueTasks.length > 0 && (
                <span className="text-destructive">{overdueTasks.length} overdue</span>
              )}
              {overdueTasks.length === 0 && "All on track"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours This Month</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(timeTracking.hours_this_month || 0)}h
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round(timeTracking.billable_hours_month || 0)}h billable
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.onTimeRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {performance.tasks_completed_month || 0} completed this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left Column - 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          {/* My Projects */}
          <Card>
            <CardHeader>
              <CardTitle>My Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No projects assigned</p>
              ) : (
                <div className="space-y-3">
                  {projects.slice(0, 5).map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{project.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {project.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{project.code}</span>
                            <span>{project.role}</span>
                            <span>{project.allocation_percentage}% allocation</span>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-medium">{project.task_count} tasks</div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round(project.hours_this_month || 0)}h this month
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>My Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks assigned</p>
              ) : (
                <div className="space-y-2">
                  {tasks.slice(0, 8).map((task) => {
                    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done"
                    return (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg border ${
                          isOverdue ? "border-destructive bg-destructive/5" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{task.title}</span>
                              {isOverdue && (
                                <AlertCircle className="h-4 w-4 text-destructive" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{task.project_name}</span>
                              {task.due_date && (
                                <>
                                  <span>•</span>
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(task.due_date)}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={`${getStatusColor(task.status)} text-white text-xs`}
                            >
                              {task.status}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`${getPriorityColor(task.priority)} text-white text-xs`}
                            >
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 1/3 */}
        <div className="space-y-4">
          {/* Time Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Time Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>This Week</span>
                  <span className="font-medium">
                    {Math.round(timeTracking.hours_this_week || 0)}h
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span>This Month</span>
                  <span className="font-medium">
                    {Math.round(timeTracking.hours_this_month || 0)}h
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground mb-2">Billable Breakdown</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Billable</span>
                    <span>{Math.round(timeTracking.billable_hours_month || 0)}h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Non-billable</span>
                    <span>{Math.round(timeTracking.non_billable_hours_month || 0)}h</span>
                  </div>
                </div>
              </div>
              {timeTracking.byProject && timeTracking.byProject.length > 0 && (
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground mb-2">By Project</div>
                  <div className="space-y-1">
                    {timeTracking.byProject.map((p: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="truncate">{p.project_name}</span>
                        <span className="font-medium">{Math.round(p.total_hours)}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills */}
          {skills && skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>My Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {skills.slice(0, 5).map((skill, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{skill.name}</div>
                        <div className="text-xs text-muted-foreground">{skill.category}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {skill.proficiency_level}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

