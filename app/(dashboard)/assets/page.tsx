"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Asset {
  id: number
  name: string
  type: string
  category: string | null
  serial_number: string | null
  manufacturer: string | null
  model: string | null
  assigned_to_name: string | null
  status: string
  location: string | null
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAssets()
  }, [])

  const fetchAssets = async () => {
    try {
      const { getStoredToken } = await import("@/lib/utils/storage")
      const token = getStoredToken()
      
      if (!token) {
        throw new Error("No authentication token")
      }
      const response = await fetch("/api/assets", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch assets")
      }

      const data = await response.json()
      setAssets(data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching assets:", error)
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      assigned: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      maintenance: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      retired: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return <div>Loading assets...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assets</h1>
          <p className="text-muted-foreground">Manage IT assets and inventory</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Asset
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset List</CardTitle>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assets found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell className="capitalize">{asset.type}</TableCell>
                    <TableCell>{asset.category || "-"}</TableCell>
                    <TableCell>{asset.serial_number || "-"}</TableCell>
                    <TableCell>{asset.manufacturer || "-"}</TableCell>
                    <TableCell>{asset.assigned_to_name || "Unassigned"}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                          asset.status
                        )}`}
                      >
                        {asset.status.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>{asset.location || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
