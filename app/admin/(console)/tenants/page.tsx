"use client"

import { AdminTenantPanel } from "@/components/dashboard/admin-tenant-panel"
import { AgentBundlePanel } from "@/components/dashboard/agent-bundle-panel"
import { useAdminSession } from "@/contexts/admin-session-context"

export default function AdminTenantsPage() {
  const { token, bumpTenantsVersion, broadcastAgentUpdate } = useAdminSession()

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tenants & agents</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Tenant IDs and agent secrets for clients, plus platform-wide agent update bundles.
        </p>
      </header>
      <AdminTenantPanel authToken={token} onTenantsChange={bumpTenantsVersion} />
      <AgentBundlePanel authToken={token} onPushAgentUpdate={broadcastAgentUpdate} />
    </div>
  )
}
