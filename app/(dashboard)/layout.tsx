"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  Clock,
  Building2,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { getStoredToken, getStoredUser, clearAuthStorage } from "@/lib/utils/storage"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false) // Mobile-first: closed by default

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") {
      return
    }

    try {
      const token = getStoredToken()
      const userData = getStoredUser()

      if (!token || !userData) {
        router.push("/login")
        return
      }

      setUser(userData)
    } catch (error) {
      console.error("Error loading user data:", error)
      clearAuthStorage()
      router.push("/login")
    }
  }, [router])

  const handleLogout = () => {
    clearAuthStorage()
    router.push("/login")
  }

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Users, label: "Employees", href: "/employees" },
    { icon: FolderKanban, label: "Projects", href: "/projects" },
    { icon: CheckSquare, label: "Tasks", href: "/tasks" },
    { icon: Clock, label: "Time Tracking", href: "/time" },
    { icon: Building2, label: "Clients", href: "/clients" },
    { icon: Package, label: "Assets", href: "/assets" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ]

  // Role-based menu items (check user role from stored data)
  const roleBasedItems: Array<{ icon: any; label: string; href: string }> = []
  const userRole = (user as any)?.roleName || (user as any)?.role || ""
  const userEmail = (user as any)?.email || ""
  
  if (userRole === "admin" || userEmail === "admin@iterp.com" || userEmail?.includes("admin")) {
    roleBasedItems.push({ icon: LayoutDashboard, label: "Admin", href: "/admin/dashboard" })
    roleBasedItems.push({ icon: Users, label: "HR", href: "/hr/dashboard" })
  }
  if (userRole === "manager" || userRole === "admin" || userEmail?.includes("manager")) {
    roleBasedItems.push({ icon: FolderKanban, label: "Manager", href: "/manager/dashboard" })
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 w-full border-b bg-card">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <h1 className="font-bold text-lg">IT ERP</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex h-screen lg:h-[calc(100vh-0px)]">
        {/* Sidebar - Mobile Overlay / Desktop Sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <aside
          className={`${
            sidebarOpen
              ? "fixed lg:relative inset-y-0 left-0 z-50 w-64"
              : "hidden lg:flex lg:w-20"
          } bg-card border-r transition-all duration-300 flex flex-col`}
        >
          <div className="hidden lg:flex p-4 border-b items-center justify-between">
            <h1 className={`font-bold text-xl ${!sidebarOpen && "hidden"}`}>
              IT ERP
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <div className="lg:hidden p-4 border-b flex items-center justify-between">
            <h1 className="font-bold text-xl">IT ERP</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </Link>
              )
            })}
            {roleBasedItems.length > 0 && (
              <>
                <div className={`pt-4 ${!sidebarOpen && "hidden"}`}>
                  <div className="text-xs font-semibold text-muted-foreground uppercase px-3 mb-2">
                    Role Dashboards
                  </div>
                </div>
                {roleBasedItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {sidebarOpen && <span className="truncate">{item.label}</span>}
                    </Link>
                  )
                })}
              </>
            )}
          </nav>
          <div className="p-4 border-t mt-auto">
            <div className={`mb-2 ${!sidebarOpen && "hidden lg:block"}`}>
              <p className="text-sm font-medium truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <div className="hidden lg:flex mb-2">
              <ThemeToggle />
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 lg:mr-2" />
              {sidebarOpen && <span className="hidden lg:inline">Logout</span>}
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto w-full">
          <div className="p-4 sm:p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}

