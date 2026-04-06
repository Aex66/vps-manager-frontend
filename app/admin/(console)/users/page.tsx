"use client"

import { AdminUsersPanel } from "@/components/dashboard/admin-users-panel"
import { useAdminSession } from "@/contexts/admin-session-context"

export default function AdminUsersPage() {
  const { token, currentUsername, tenantsVersion } = useAdminSession()

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Users &amp; access</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Operators and client logins. Details and the compact table live in the panel below.
        </p>
      </header>
      <AdminUsersPanel
        authToken={token}
        currentUsername={currentUsername}
        tenantsVersion={tenantsVersion}
      />
    </div>
  )
}
