"use client"
import {
  RefreshCw,
  Power,
  LayoutGrid,
  List,
  Filter,
  ArrowUpDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type StatusFilter = "all" | "running" | "stopped" | "restarting"
export type SortKey = "name" | "status" | "cpu" | "roblox"

interface GlobalControlsProps {
  viewMode: "grid" | "list"
  onViewModeChange: (mode: "grid" | "list") => void
  onRefresh: () => void
  onStartAll: () => void
  onStopAll: () => void
  onRestartAll: () => void
  statusFilter: StatusFilter
  onStatusFilterChange: (filter: StatusFilter) => void
  sortKey: SortKey
  onSortKeyChange: (key: SortKey) => void
  autoRestartEnabled: boolean
  onAutoRestartChange: (enabled: boolean) => void
  autoIntervalMinutes: number
  onAutoIntervalMinutesChange: (minutes: number) => void
  /** True while bulk Start/Stop/Restart all are on cooldown */
  bulkActionsOnCooldown: boolean
}

export function GlobalControls({
  viewMode,
  onViewModeChange,
  onRefresh,
  onStartAll,
  onStopAll,
  onRestartAll,
  statusFilter,
  onStatusFilterChange,
  sortKey,
  onSortKeyChange,
  autoRestartEnabled,
  onAutoRestartChange,
  autoIntervalMinutes,
  onAutoIntervalMinutesChange,
  bulkActionsOnCooldown,
}: GlobalControlsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="border-border"
            title="Broadcast refresh (start stack)"
            onClick={onRefresh}
            disabled={bulkActionsOnCooldown}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 border-border"
                disabled={bulkActionsOnCooldown}
              >
                <Power className="h-4 w-4" />
                <span className="hidden sm:inline">Bulk Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem disabled={bulkActionsOnCooldown} onClick={onStartAll}>
                Start All
              </DropdownMenuItem>
              <DropdownMenuItem disabled={bulkActionsOnCooldown} onClick={onStopAll}>
                Stop All
              </DropdownMenuItem>
              <DropdownMenuItem disabled={bulkActionsOnCooldown} onClick={onRestartAll}>
                Restart All
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 border-border">
                <Filter className="h-4 w-4" />
                <span>
                  Filter
                  {statusFilter !== "all" ? ` (${statusFilter})` : ""}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onStatusFilterChange("all")}>
                All Servers
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusFilterChange("running")}>
                Running
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusFilterChange("stopped")}>
                Stopped
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusFilterChange("restarting")}>
                Restarting
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 border-border">
                <ArrowUpDown className="h-4 w-4" />
                <span>Sort</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onSortKeyChange("name")}>Name</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortKeyChange("status")}>Status</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortKeyChange("cpu")}>CPU Usage</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortKeyChange("roblox")}>
                Roblox instances
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex rounded-md border border-border">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={() => onViewModeChange("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => onViewModeChange("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card/50 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex items-center gap-3">
          <Switch
            id="auto-restart"
            checked={autoRestartEnabled}
            onCheckedChange={onAutoRestartChange}
          />
          <Label htmlFor="auto-restart" className="cursor-pointer text-sm font-normal">
            Auto-restart
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="auto-interval" className="text-muted-foreground text-sm whitespace-nowrap">
            Interval (min)
          </Label>
          <Input
            id="auto-interval"
            type="number"
            min={1}
            className="h-8 w-16 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            value={autoIntervalMinutes}
            onChange={(e) => onAutoIntervalMinutesChange(Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  )
}
