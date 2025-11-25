"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bug, CheckSquare, AlertCircle } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function QADashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQAData()
  }, [])

  const fetchQAData = async () => {
    try {
      const { getStoredToken } = await import("@/lib/utils/storage")
      const token = getStoredToken()

      if (!token) {
        throw new Error("No authentication token")
      }

      const response = await fetch("/api/qa/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch QA data")
      }

      const qaData = await response.json()
      setData(qaData)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching QA data:", error)
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading QA dashboard...</div>
  }

  if (!data) {
    return <div>Error loading dashboard</div>
  }

  const { tasks, bugsByProject } = data

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">QA Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Quality assurance and testing
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">Assigned test tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bugs Found</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bugsByProject.reduce((sum: number, p: any) => sum + p.bug_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Test Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No test tasks assigned</p>
            ) : (
              <div className="space-y-3">
                {tasks.slice(0, 8).map((task: any) => (
                  <div key={task.id} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-sm">{task.title}</div>
                      <Badge variant="outline">{task.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {task.project_name} • {task.due_date ? formatDate(task.due_date) : "No due date"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bugs by Project</CardTitle>
          </CardHeader>
          <CardContent>
            {bugsByProject.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bugs found</p>
            ) : (
              <div className="space-y-3">
                {bugsByProject.map((project: any) => (
                  <div key={project.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <div className="font-medium">{project.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="font-bold text-destructive">{project.bug_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

