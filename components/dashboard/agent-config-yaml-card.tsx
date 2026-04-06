"use client"

import { useMemo, useSyncExternalStore } from "react"
import { Clipboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { wsAgentUrl } from "@/lib/api"
import { getCmdSecret, VPS_CMD_SECRET_CHANGED_EVENT } from "@/lib/cmd-secret"

function subscribeCmdSecret(cb: () => void) {
  if (typeof window === "undefined") return () => {}
  window.addEventListener(VPS_CMD_SECRET_CHANGED_EVENT, cb)
  window.addEventListener("storage", cb)
  return () => {
    window.removeEventListener(VPS_CMD_SECRET_CHANGED_EVENT, cb)
    window.removeEventListener("storage", cb)
  }
}

function buildYaml(tenantId: string, wsUrl: string, commandSecret: string): string {
  const cmd = commandSecret.trim()
  const cmdLine =
    cmd !== ""
      ? `command_secret: ${JSON.stringify(cmd)}`
      : `# command_secret: ""  # optional: set after Settings → Command secret (same value in secret.txt)`

  return [
    `# Paste into agent_config.yaml next to the agent.`,
    ``,
    `# Tenant agent secret — used to authorize the connection between the agent and the server for tenant "${tenantId}".`,
    `# This value is set by your operator on the server.`,
    `agent_secret: "PASTE_AGENT_SECRET_FROM_YOUR_OPERATOR"`,
    ``,
    `vps_manager_ws: ${JSON.stringify(wsUrl)}`,
    ``,
    `tenant_id: ${JSON.stringify(tenantId)}`,
    ``,
    cmdLine,
  ].join("\n")
}

export function AgentConfigYamlCard({ tenantId }: { tenantId: string }) {
  const tid = tenantId.trim() || "default"
  const cmdSecret = useSyncExternalStore(
    subscribeCmdSecret,
    getCmdSecret,
    () => "",
  )
  const yaml = useMemo(() => buildYaml(tid, wsAgentUrl(), cmdSecret), [tid, cmdSecret])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(yaml)
      toast({ title: "Copied", description: "Copied to clipboard." })
    } catch {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      })
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card/50 p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Copy values for agent_config.yaml</h2>
          <p className="text-sm text-muted-foreground">
            Put this next to the agent executable. Replace <span className="font-mono text-xs">agent_secret</span> with
            the secret your operator configured for this tenant.{" "}
            <span className="font-mono text-xs">command_secret</span> appears here once you save it under Settings →
            Command secret.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" className="shrink-0 gap-1.5" onClick={() => void copy()}>
          <Clipboard className="h-4 w-4" />
          Copy snippet
        </Button>
      </div>
      <pre className="max-h-56 overflow-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground">
        {yaml}
      </pre>
    </section>
  )
}
