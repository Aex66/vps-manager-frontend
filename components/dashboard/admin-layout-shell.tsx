"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { Building2, LayoutDashboard, Users } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import {
  AdminSessionProvider,
  type AdminSessionContextValue,
} from "@/contexts/admin-session-context"
import { useVpsDashboard } from "@/hooks/use-vps-dashboard"
import { fetchAdminSession, logoutAdminSession } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const ADMIN_LOGIN = "/admin/login"

const nav = [
  { href: "/admin/tenants", label: "Tenants & agents", icon: Building2 },
  { href: "/admin/users", label: "Users", icon: Users },
] as const

export function AdminLayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [token, setToken] = useState<string | null>(null)
  const [currentUsername, setCurrentUsername] = useState("")
  const [authChecked, setAuthChecked] = useState(false)
  const [tenantsVersion, setTenantsVersion] = useState(0)

  const bumpTenantsVersion = useCallback(() => {
    setTenantsVersion((n) => n + 1)
  }, [])

  useLayoutEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const s = await fetchAdminSession()
        if (cancelled) return
        if (!s || s.role !== "admin") {
          setAuthChecked(true)
          window.location.replace(ADMIN_LOGIN)
          return
        }
        setToken(s.token)
        setCurrentUsername(s.username)
        setAuthChecked(true)
      } catch {
        if (!cancelled) {
          setAuthChecked(true)
          window.location.replace(ADMIN_LOGIN)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const { broadcastAgentUpdate } = useVpsDashboard(token)

  const onLogout = () => {
    void (async () => {
      try {
        await logoutAdminSession()
      } catch {
        /* ignore */
      }
      window.location.replace(ADMIN_LOGIN)
    })()
  }

  const ctx = useMemo<AdminSessionContextValue | null>(() => {
    if (!token) return null
    return {
      token,
      currentUsername,
      tenantsVersion,
      bumpTenantsVersion,
      broadcastAgentUpdate,
    }
  }, [
    token,
    currentUsername,
    tenantsVersion,
    bumpTenantsVersion,
    broadcastAgentUpdate,
  ])

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!token || !ctx) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Redirecting…
      </div>
    )
  }

  return (
    <AdminSessionProvider value={ctx}>
      <div className="flex min-h-screen flex-col bg-background">
        <Header
          searchValue=""
          onSearchChange={() => {}}
          onLogout={onLogout}
          showSearch={false}
          showTermsLink={false}
          showBackToDashboard
          accountUsername={currentUsername}
        />
        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card/40 md:flex">
            <div className="border-b border-border px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Operator
              </p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">Console</p>
            </div>
            <nav className="flex flex-1 flex-col gap-0.5 p-3">
              {nav.map(({ href, label, icon: Icon }) => {
                const active = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-80" />
                    {label}
                  </Link>
                )
              })}
            </nav>
            <div className="border-t border-border p-3">
              <Button
                variant="ghost"
                className="h-9 w-full justify-start gap-2 text-muted-foreground"
                asChild
              >
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  Client dashboard
                </Link>
              </Button>
            </div>
          </aside>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="border-b border-border bg-background/80 px-4 py-3 md:hidden">
              <nav className="flex flex-wrap gap-2">
                {nav.map(({ href, label }) => {
                  const active = pathname === href
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium",
                        active
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted/60 text-muted-foreground",
                      )}
                    >
                      {label}
                    </Link>
                  )
                })}
              </nav>
            </div>
            <main className="min-h-0 w-full flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
              {children}
            </main>
          </div>
        </div>
      </div>
    </AdminSessionProvider>
  )
}
