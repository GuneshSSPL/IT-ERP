"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, BookOpen } from "lucide-react"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

export default function HRDashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHRData()
  }, [])

  const fetchHRData = async () => {
    try {
      const { getStoredToken } = await import("@/lib/utils/storage")
      const token = getStoredToken()

      if (!token) {
        throw new Error("No authentication token")
      }

      const response = await fetch("/api/hr/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch HR data")
      }

      const hrData = await response.json()
      setData(hrData)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching HR data:", error)
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading HR dashboard...</div>
  }

  if (!data) {
    return <div>Error loading dashboard</div>
  }

  const { employees, leaveRequests, skillsInventory } = data
  const activeEmployees = employees.filter((e: any) => e.is_active)

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">HR Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Employee management and resources
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEmployees.length}</div>
            <p className="text-xs text-muted-foreground">Active employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leave Requests</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveRequests.length}</div>
            <p className="text-xs text-muted-foreground">Pending approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skills</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{skillsInventory.length}</div>
            <p className="text-xs text-muted-foreground">Tracked skills</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employees.slice(0, 5).map((employee: any) => (
                <Link
                  key={employee.id}
                  href={`/employees/${employee.id}`}
                  className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {employee.first_name} {employee.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {employee.role_name} • {employee.department_name || "No department"}
                      </div>
                    </div>
                    <Badge variant={employee.is_active ? "default" : "secondary"}>
                      {employee.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {leaveRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending leave requests</p>
            ) : (
              <div className="space-y-3">
                {leaveRequests.map((request: any) => (
                  <div key={request.id} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{request.employee_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(request.start_date)} - {formatDate(request.end_date)}
                        </div>
                      </div>
                      <Badge variant="outline">{request.leave_type}</Badge>
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

