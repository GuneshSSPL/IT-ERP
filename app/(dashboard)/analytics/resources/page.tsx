"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Users, BookOpen } from "lucide-react"

export default function ResourceAnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const { getStoredToken } = await import("@/lib/utils/storage")
      const token = getStoredToken()

      if (!token) {
        throw new Error("No authentication token")
      }

      const response = await fetch("/api/analytics/resources", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch analytics")
      }

      const analyticsData = await response.json()
      setData(analyticsData)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching analytics:", error)
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading analytics...</div>
  }

  if (!data) {
    return <div>Error loading analytics</div>
  }

  const { utilizationByRole, skillDemandSupply, overallocatedEmployees } = data

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Resource Analytics</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Resource utilization and skill analysis
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Utilization by Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {utilizationByRole.map((role: any) => (
                <div key={role.role_name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{role.role_name}</span>
                    <span className="text-sm">{Math.round(role.avg_allocation || 0)}%</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {role.employee_count} employees
                    {role.overallocated_count > 0 && (
                      <span className="text-destructive ml-2">
                        {role.overallocated_count} overallocated
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Overallocated Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overallocatedEmployees.length === 0 ? (
              <p className="text-sm text-muted-foreground">No overallocated employees</p>
            ) : (
              <div className="space-y-3">
                {overallocatedEmployees.map((emp: any) => (
                  <div key={emp.id} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm font-medium">{emp.name}</span>
                    <Badge variant="destructive">{Math.round(emp.total_allocation)}%</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Skill Demand vs Supply
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {skillDemandSupply.slice(0, 10).map((skill: any) => {
                const gap = skill.demand - skill.supply
                return (
                  <div key={skill.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{skill.name}</span>
                      {gap > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          Gap: {gap}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Demand: {skill.demand} • Supply: {skill.supply}
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

