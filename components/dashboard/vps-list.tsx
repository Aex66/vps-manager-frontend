"use client"

import type { VPS } from "@/lib/vps-data"
import type { VpsSettingsPanel, VPSRow } from "@/lib/types"
import { cn } from "@/lib/utils"
import { VpsServerDropdown } from "@/components/dashboard/vps-server-dropdown"

interface VPSListProps {
  servers: VPS[]
  selectedId: string | null
  onSelect: (id: string) => void
  onRunCommand: (vpsId: string, cmd: string) => void
  onOpenCommandMenu: (row: VPSRow, anchor: { x: number; y: number }) => void
  isVpsCommandCoolingDown: (vpsId: string) => boolean
  onOpenSettings: (row: VPSRow, panel: VpsSettingsPanel) => void
}

function StatusDot({ status }: { status: VPS["status"] }) {
  return (
    <div
      className={cn("h-2 w-2 shrink-0 rounded-full", {
        "bg-success animate-pulse": status === "running",
        "bg-muted-foreground": status === "stopped",
        "bg-warning animate-pulse": status === "restarting",
      })}
    />
  )
}

export function VPSList({
  servers,
  selectedId,
  onSelect,
  onRunCommand,
  onOpenCommandMenu,
  onOpenSettings,
  isVpsCommandCoolingDown,
}: VPSListProps) {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
      {servers.map((server) => {
        const row = server.agentRow
        const hasMetrics = Boolean(row?.has_metrics)
        const robloxLabel = hasMetrics
          ? server.robloxInstances === 1
            ? "1"
            : String(server.robloxInstances)
          : "—"
        const cooling = isVpsCommandCoolingDown(server.id)

        return (
          <div
            key={server.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(server.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onSelect(server.id)
              }
            }}
            className={cn(
              "flex cursor-pointer flex-col gap-3 p-4 transition-colors hover:bg-secondary/40 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
              selectedId === server.id && "bg-accent/10 ring-1 ring-inset ring-accent/40",
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <StatusDot status={server.status} />
              <div className="min-w-0">
                <div className="truncate font-medium text-foreground">{server.name}</div>
                <div className="text-xs capitalize text-muted-foreground">{server.status}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm sm:justify-end">
              <div>
                <span className="text-muted-foreground">CPU </span>
                <span className="tabular-nums text-foreground">{server.cpu}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Roblox </span>
                <span className="tabular-nums text-foreground">{robloxLabel}</span>
              </div>
              <div className="text-muted-foreground tabular-nums">{server.ip}</div>
              <VpsServerDropdown
                server={server}
                commandCooldown={cooling}
                onRunCommand={onRunCommand}
                onOpenCommandMenu={onOpenCommandMenu}
                onOpenSettings={onOpenSettings}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
