"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Package, FolderKanban, CheckSquare } from "lucide-react"

export default function OffboardPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reassignTasks, setReassignTasks] = useState<Record<number, number>>({})
  const [reassignProjects, setReassignProjects] = useState(false)
  const [revokeAssets, setRevokeAssets] = useState(false)

  useEffect(() => {
    if (params?.id) {
      fetchOffboardData()
    }
  }, [params?.id])

  const fetchOffboardData = async () => {
    if (!params?.id) return
    
    try {
      const { getStoredToken } = await import("@/lib/utils/storage")
      const token = getStoredToken()

      if (!token) {
        throw new Error("No authentication token")
      }

      const response = await fetch(`/api/employees/${params.id}/offboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch offboarding data")
      }

      const offboardData = await response.json()
      setData(offboardData)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching offboarding data:", error)
      setLoading(false)
    }
  }

  const handleOffboard = async () => {
    if (!params?.id) return
    
    try {
      const { getStoredToken } = await import("@/lib/utils/storage")
      const token = getStoredToken()

      const response = await fetch(`/api/employees/${params.id}/offboard`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reassignTasks: Object.entries(reassignTasks).map(([taskId, userId]) => ({
            taskId: parseInt(taskId),
            newUserId: userId,
          })),
          reassignProjects,
          revokeAssets,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to offboard employee")
      }

      router.push("/employees")
    } catch (error) {
      console.error("Error offboarding employee:", error)
    }
  }

  if (loading) {
    return <div>Loading offboarding data...</div>
  }

  if (!data) {
    return <div>Error loading data</div>
  }

  const { assets, projects, tasks } = data

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/employees")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Employee Offboarding</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Complete the offboarding checklist
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Assets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Assets ({assets.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {assets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assets assigned</p>
            ) : (
              <>
                {assets.map((asset: any) => (
                  <div key={asset.id} className="p-2 border rounded text-sm">
                    {asset.name} - {asset.type}
                  </div>
                ))}
                <div className="flex items-center space-x-2 pt-2 border-t">
                  <Checkbox
                    id="revokeAssets"
                    checked={revokeAssets}
                    onCheckedChange={(checked) => setRevokeAssets(checked as boolean)}
                  />
                  <label htmlFor="revokeAssets" className="text-sm">
                    Revoke all assets
                  </label>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              Projects ({projects.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects assigned</p>
            ) : (
              <>
                {projects.map((project: any) => (
                  <div key={project.id} className="p-2 border rounded text-sm">
                    <div className="font-medium">{project.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {project.task_count} tasks
                    </div>
                  </div>
                ))}
                <div className="flex items-center space-x-2 pt-2 border-t">
                  <Checkbox
                    id="reassignProjects"
                    checked={reassignProjects}
                    onCheckedChange={(checked) => setReassignProjects(checked as boolean)}
                  />
                  <label htmlFor="reassignProjects" className="text-sm">
                    Remove from all projects
                  </label>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Tasks ({tasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active tasks</p>
            ) : (
              tasks.map((task: any) => (
                <div key={task.id} className="p-2 border rounded text-sm">
                  <div className="font-medium">{task.title}</div>
                  <div className="text-xs text-muted-foreground">{task.project_name}</div>
                  <div className="mt-1">
                    <input
                      type="number"
                      placeholder="Reassign to User ID"
                      className="w-full text-xs p-1 border rounded"
                      onChange={(e) => {
                        if (e.target.value) {
                          setReassignTasks({
                            ...reassignTasks,
                            [task.id]: parseInt(e.target.value),
                          })
                        } else {
                          const newReassign = { ...reassignTasks }
                          delete newReassign[task.id]
                          setReassignTasks(newReassign)
                        }
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleOffboard} className="w-full sm:w-auto">
          Complete Offboarding
        </Button>
      </div>
    </div>
  )
}

