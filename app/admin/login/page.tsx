"use client"

import Link from "next/link"
import { useState } from "react"
import { loginAdminWithCookie } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const ADMIN_HOME = "/admin/tenants"

export default function AdminLoginPage() {
  const [user, setUser] = useState("")
  const [pass, setPass] = useState("")
  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr("")
    setLoading(true)
    try {
      await loginAdminWithCookie(user, pass)
      window.location.assign(ADMIN_HOME)
    } catch (ex) {
      const msg = ex instanceof Error ? ex.message : String(ex)
      if (msg === "use_dashboard_login") {
        setErr("This account is for the VPS dashboard. Sign in there instead.")
      } else {
        setErr("Invalid username or password.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-foreground">Operator panel</h1>
          <p className="text-xs text-muted-foreground">Platform admin sign-in</p>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="user">Username</Label>
            <Input
              id="user"
              autoComplete="username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pass">Password</Label>
            <Input
              id="pass"
              type="password"
              autoComplete="current-password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/dashboard/login" className="underline-offset-4 hover:underline">
            VPS dashboard sign-in (clients)
          </Link>
        </p>
      </div>
    </div>
  )
}
