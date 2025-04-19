"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useToast } from "@/components/ui/toaster"
import { useAuth } from "@/hooks/use-auth"
import { BarChart3, Home, LogOut, Menu, Settings, User, PieChart, Bell, CreditCard } from "lucide-react"
import { ModeToggle } from "./mode-toggle"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()
  const { isAuthenticated, user, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  const handleLogout = () => {
    logout()
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    })
    router.push("/")
  }

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
  ]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto border-r bg-white dark:bg-gray-800">
          <div className="flex items-center flex-shrink-0 px-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">API Cost Manager</span>
            </Link>
          </div>
          <div className="mt-8 flex-1 flex flex-col justify-between">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            <div className="px-2 pb-6 pt-2 space-y-2">
              <div className="flex items-center px-2 py-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                <User className="mr-3 h-5 w-5" />
                {user?.name || "User"}
              </div>
              <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </Button>
              <div className="px-2 pt-2">
                <ModeToggle />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="absolute top-4 left-4 z-50">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full">
              <div className="flex items-center flex-shrink-0 px-4 h-16">
                <Link href="/dashboard" className="flex items-center space-x-2" onClick={() => setIsMobileOpen(false)}>
                  <BarChart3 className="h-6 w-6 text-primary" />
                  <span className="font-bold text-xl">API Cost Manager</span>
                </Link>
              </div>
              <div className="mt-4 flex-1 flex flex-col justify-between">
                <nav className="flex-1 px-2 pb-4 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        }`}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                    )
                  })}
                </nav>
                <div className="px-2 pb-6 pt-2 space-y-2">
                  <div className="flex items-center px-2 py-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                    <User className="mr-3 h-5 w-5" />
                    {user?.name || "User"}
                  </div>
                  <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                    <LogOut className="mr-3 h-5 w-5" />
                    Logout
                  </Button>
                  <div className="px-2 pt-2">
                    <ModeToggle />
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="w-full h-16 flex items-center justify-end px-4 bg-white dark:bg-gray-800 border-b md:px-6">
          <div className="md:hidden mr-auto">
            <div className="w-8"></div> {/* Spacer for mobile menu button */}
          </div>
          <div className="flex items-center space-x-4">
            <ModeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900">{children}</main>
      </div>
    </div>
  )
}
