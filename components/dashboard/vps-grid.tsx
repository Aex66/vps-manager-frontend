"use client"

import type { MouseEvent } from "react"
import {
  Cookie,
  FileJson,
  FileLock2,
  FolderOpen,
  MoreHorizontal,
  Play,
  RotateCcw,
  Square,
  Terminal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { VPS } from "@/lib/vps-data"
import type { VpsSettingsPanel, VPSRow } from "@/lib/types"
import { cn } from "@/lib/utils"

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={commandCooldown}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
              disabled={commandCooldown}
              onClick={(e) => e.stopPropagation()}
              title={commandCooldown ? "Command cooldown active" : "Server actions"}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={(e: MouseEvent) => e.stopPropagation()}
          >
            {server.status === "stopped" ? (
              <DropdownMenuItem
                className="gap-2"
                disabled={commandCooldown}
                onClick={() => row && onRunCommand(row.id, "refresh_all")}
              >
                <Play className="h-4 w-4" /> Start
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="gap-2"
                disabled={commandCooldown}
                onClick={() => row && onRunCommand(row.id, "stop_vps")}
              >
                <Square className="h-4 w-4" /> Stop
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="gap-2"
              disabled={commandCooldown}
              onClick={() => row && onRunCommand(row.id, "refresh_all")}
            >
              <RotateCcw className="h-4 w-4" /> Restart
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2"
              disabled={commandCooldown || !row}
              onClick={(e: MouseEvent) => {
                if (row) onOpenCommandMenu(row, { x: e.clientX, y: e.clientY })
              }}
            >
              <Terminal className="h-4 w-4" /> Agent commands…
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
              Settings
            </DropdownMenuLabel>
            <DropdownMenuItem
              className="gap-2"
              disabled={!row}
              onSelect={() => {
                if (!row) return
                window.setTimeout(() => onOpenSettings(row, "yummy_config"), 0)
              }}
            >
              <FileJson className="h-4 w-4" /> Yummy config
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2"
              disabled={!row}
              onSelect={() => {
                if (!row) return
                window.setTimeout(() => onOpenSettings(row, "yummy_auth"), 0)
              }}
            >
              <FileLock2 className="h-4 w-4" /> Yummy auth
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2"
              disabled={!row}
              onSelect={() => {
                if (!row) return
                window.setTimeout(() => onOpenSettings(row, "yummy_cookie"), 0)
              }}
            >
              <Cookie className="h-4 w-4" /> Yummy cookie
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2"
              disabled={!row}
              onSelect={() => {
                if (!row) return
                window.setTimeout(() => onOpenSettings(row, "volt"), 0)
              }}
            >
              <FolderOpen className="h-4 w-4" /> Volt files
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
