"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Users, Building2 } from "lucide-react"
import Link from "next/link"

export default function AnalystDashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalystData()
  }, [])

  const fetchAnalystData = async () => {
    try {
      const { getStoredToken } = await import("@/lib/utils/storage")
      const token = getStoredToken()

      if (!token) {
        throw new Error("No authentication token")
      }

      const response = await fetch("/api/analyst/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch analyst data")
      }

      const analystData = await response.json()
      setData(analystData)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching analyst data:", error)
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading analyst dashboard...</div>
  }

  if (!data) {
    return <div>Error loading dashboard</div>
  }

  const { projects, clientContacts } = data

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Business Analyst Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Requirements and stakeholder management
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">Assigned projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientContacts.length}</div>
            <p className="text-xs text-muted-foreground">Primary contacts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(projects.map((p: any) => p.client_id)).size}
            </div>
            <p className="text-xs text-muted-foreground">Unique clients</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects assigned</p>
            ) : (
              <div className="space-y-3">
                {projects.map((project: any) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-xs text-muted-foreground">{project.client_name}</div>
                      </div>
                      <Badge variant="outline">{project.status}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            {clientContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No client contacts</p>
            ) : (
              <div className="space-y-3">
                {clientContacts.map((contact: any) => (
                  <div key={contact.id} className="p-3 rounded-lg border">
                    <div className="font-medium">
                      {contact.first_name} {contact.last_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {contact.job_title} at {contact.client_name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {contact.email} • {contact.phone}
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

