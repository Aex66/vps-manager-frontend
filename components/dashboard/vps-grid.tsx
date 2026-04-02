"use client"

import { VPS } from "@/lib/vps-data"
import type { VpsSettingsPanel, VPSRow } from "@/lib/types"
import { cn } from "@/lib/utils"
import { VpsServerDropdown } from "@/components/dashboard/vps-server-dropdown"

interface VPSGridProps {
  servers: VPS[]
  selectedId: string | null
  onSelect: (id: string) => void
  onRunCommand: (vpsId: string, cmd: string) => void
  onOpenCommandMenu: (row: VPSRow, anchor: { x: number; y: number }) => void
  /** Per-vPS command cooldown (Start/Stop/Restart & menu). */
  isVpsCommandCoolingDown: (vpsId: string) => boolean
  onOpenSettings: (row: VPSRow, panel: VpsSettingsPanel) => void
}

function StatusBadge({ status }: { status: VPS["status"] }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn("h-2 w-2 rounded-full", {
          "bg-success animate-pulse": status === "running",
          "bg-muted-foreground": status === "stopped",
          "bg-warning animate-pulse": status === "restarting",
        })}
      />
      <span className="text-xs capitalize text-muted-foreground">{status}</span>
    </div>
  )
}

function UsageBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground">{value}%</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full transition-all", {
            "bg-success": value < 50,
            "bg-warning": value >= 50 && value < 80,
            "bg-destructive": value >= 80,
          })}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

/** Visual density: 15 instances fills the bar (not a percentage of RAM). */
const ROBLOX_BAR_CAP = 15

function RobloxInstancesBar({
  count,
  hasMetrics,
}: {
  count: number
  hasMetrics: boolean
}) {
  const fillPct = hasMetrics ? Math.min(100, (count / ROBLOX_BAR_CAP) * 100) : 0
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Roblox</span>
        <span className="text-foreground">
          {hasMetrics ? (count === 1 ? "1 instance" : `${count} instances`) : "—"}
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full transition-all", {
            "bg-muted-foreground/25": !hasMetrics,
            "bg-success": hasMetrics && count === 0,
            "bg-accent": hasMetrics && count > 0 && count < 10,
            "bg-warning": hasMetrics && count >= 10 && count < ROBLOX_BAR_CAP,
            "bg-destructive": hasMetrics && count >= ROBLOX_BAR_CAP,
          })}
          style={{ width: `${fillPct}%` }}
        />
      </div>
    </div>
  )
}

function VPSCard({
  server,
  isSelected,
  onSelect,
  onRunCommand,
  onOpenCommandMenu,
  onOpenSettings,
  commandCooldown,
}: {
  server: VPS
  isSelected: boolean
  onSelect: () => void
  onRunCommand: (vpsId: string, cmd: string) => void
  onOpenCommandMenu: (row: VPSRow, anchor: { x: number; y: number }) => void
  onOpenSettings: (row: VPSRow, panel: VpsSettingsPanel) => void
  commandCooldown: boolean
}) {
  const row = server.agentRow

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group cursor-pointer rounded-lg border bg-card p-4 transition-all hover:border-muted-foreground/50",
        isSelected ? "border-accent ring-1 ring-accent/50" : "border-border",
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="font-medium text-foreground">{server.name}</h3>
          <StatusBadge status={server.status} />
        </div>
        <VpsServerDropdown
          server={server}
          commandCooldown={commandCooldown}
          onRunCommand={onRunCommand}
          onOpenCommandMenu={onOpenCommandMenu}
          onOpenSettings={onOpenSettings}
          triggerClassName="opacity-0 transition-opacity group-hover:opacity-100"
        />
      </div>

      <div className="space-y-2">
        <UsageBar value={server.cpu} label="CPU" />
        <RobloxInstancesBar
          count={server.robloxInstances}
          hasMetrics={Boolean(row?.has_metrics)}
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span>{server.ip}</span>
      </div>
    </div>
  )
}

export function VPSGrid({
  servers,
  selectedId,
  onSelect,
  onRunCommand,
  onOpenCommandMenu,
  onOpenSettings,
  isVpsCommandCoolingDown,
}: VPSGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {servers.map((server) => (
        <VPSCard
          key={server.id}
          server={server}
          isSelected={selectedId === server.id}
          onSelect={() => onSelect(server.id)}
          onRunCommand={onRunCommand}
          onOpenCommandMenu={onOpenCommandMenu}
          onOpenSettings={onOpenSettings}
          commandCooldown={isVpsCommandCoolingDown(server.id)}
        />
      ))}
    </div>
  )
}
