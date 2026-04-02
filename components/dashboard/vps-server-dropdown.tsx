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
import type { VPS } from "@/lib/vps-data"
import type { VpsSettingsPanel, VPSRow } from "@/lib/types"
import { cn } from "@/lib/utils"

export function VpsServerDropdown({
  server,
  commandCooldown,
  onRunCommand,
  onOpenCommandMenu,
  onOpenSettings,
  triggerClassName,
  stopPropagationOnTrigger = true,
}: {
  server: VPS
  commandCooldown: boolean
  onRunCommand: (vpsId: string, cmd: string) => void
  onOpenCommandMenu: (row: VPSRow, anchor: { x: number; y: number }) => void
  onOpenSettings: (row: VPSRow, panel: VpsSettingsPanel) => void
  triggerClassName?: string
  stopPropagationOnTrigger?: boolean
}) {
  const row = server.agentRow

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={commandCooldown}>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 shrink-0", triggerClassName)}
          disabled={commandCooldown}
          onClick={
            stopPropagationOnTrigger ? (e) => e.stopPropagation() : undefined
          }
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
  )
}
