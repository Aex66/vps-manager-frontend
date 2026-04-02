"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Header } from "@/components/dashboard/header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import {
  GlobalControls,
  type SortKey,
  type StatusFilter,
} from "@/components/dashboard/global-controls"
import { VPSGrid } from "@/components/dashboard/vps-grid"
import { LiveViewPanel } from "@/components/dashboard/live-view-panel"
import { CommandFlyout } from "@/components/dashboard/command-flyout"
import {
  VpsSettingsDialog,
  type VpsSettingsTarget,
} from "@/components/dashboard/vps-settings-dialog"
import { useVpsDashboard } from "@/hooks/use-vps-dashboard"
import type { VPS } from "@/lib/vps-data"

function sortServers(list: VPS[], key: SortKey): VPS[] {
  const copy = [...list]
  copy.sort((a, b) => {
    switch (key) {
      case "name":
        return a.name.localeCompare(b.name)
      case "status":
        return a.status.localeCompare(b.status)
      case "cpu":
        return b.cpu - a.cpu
      case "roblox":
        return b.robloxInstances - a.robloxInstances
      default:
        return 0
    }
  })
  return copy
}

export default function Dashboard() {
  const [token, setToken] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const lastShotForId = useRef<string | null>(null)
  const [settingsTarget, setSettingsTarget] = useState<VpsSettingsTarget>(null)

  useLayoutEffect(() => {
    try {
      const t = sessionStorage.getItem("vps_token")
      if (!t) {
        setAuthChecked(true)
        window.location.replace("/login")
        return
      }
      setToken(t)
      setAuthChecked(true)
    } catch {
      setAuthChecked(true)
      window.location.replace("/login")
    }
  }, [])

  const {
    servers,
    vpsList,
    wsError,
    shots,
    lastShotAt,
    logs,
    search,
    setSearch,
    selectedRow,
    setSelectedRow,
    selectedServer,
    commandMenu,
    setCommandMenu,
    sendCommand,
    broadcastCommand,
    openCommandMenu,
    runningCount,
    avgCpu,
    totalCount,
    autoEnabled,
    autoMinDraft,
    shotInterval,
    applyAutoRestart,
    pushShotInterval,
    setAutoIntervalMinutes,
    isVpsCommandCoolingDown,
    isBulkCommandCoolingDown,
    agentRpc,
    broadcastAgentUpdate,
  } = useVpsDashboard(token)

  useEffect(() => {
    const id = selectedRow?.id
    if (!id) {
      lastShotForId.current = null
      return
    }
    if (lastShotForId.current === id) return
    lastShotForId.current = id
    sendCommand(id, "screenshot", { bypassCooldown: true })
  }, [selectedRow?.id, sendCommand])

  const displayedServers = useMemo(() => {
    let list = servers
    if (statusFilter !== "all") {
      list = list.filter((s) => s.status === statusFilter)
    }
    return sortServers(list, sortKey)
  }, [servers, statusFilter, sortKey])

  const selectedId = selectedRow?.id ?? null

  const onLogout = () => {
    sessionStorage.removeItem("vps_token")
    window.location.replace("/login")
  }

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Redirecting to sign in…
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header searchValue={search} onSearchChange={setSearch} onLogout={onLogout} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <main className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Servers</h1>
              <p className="text-sm text-muted-foreground">
                Manage and monitor your virtual private servers
              </p>
            </div>

            {wsError && (
              <div
                className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground"
                role="alert"
              >
                {wsError}
              </div>
            )}

            <StatsCards
              totalServers={totalCount}
              runningServers={runningCount}
              avgCpu={avgCpu}
            />

            <GlobalControls
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onRefresh={() => broadcastCommand("refresh_all")}
              onStartAll={() => broadcastCommand("refresh_all")}
              onStopAll={() => broadcastCommand("stop_vps")}
              onRestartAll={() => broadcastCommand("refresh_all")}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              sortKey={sortKey}
              onSortKeyChange={setSortKey}
              autoRestartEnabled={autoEnabled}
              onAutoRestartChange={applyAutoRestart}
              autoIntervalMinutes={autoMinDraft}
              onAutoIntervalMinutesChange={setAutoIntervalMinutes}
              screenshotIntervalSec={shotInterval}
              onScreenshotIntervalChange={(s) => pushShotInterval(s)}
              bulkActionsOnCooldown={isBulkCommandCoolingDown()}
              authToken={token}
              onPushAgentUpdate={broadcastAgentUpdate}
            />

            <VPSGrid
              servers={displayedServers}
              selectedId={selectedId}
              onSelect={(id) => setSelectedRow(vpsList.find((v) => v.id === id) ?? null)}
              onRunCommand={sendCommand}
              onOpenCommandMenu={openCommandMenu}
              onOpenSettings={(row, panel) => setSettingsTarget({ row, panel })}
              isVpsCommandCoolingDown={isVpsCommandCoolingDown}
            />

            {totalCount === 0 && (
              <p className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
                No agents connected.
              </p>
            )}
          </div>
        </main>

        <aside className="flex h-full w-96 shrink-0 flex-col border-l border-border bg-card">
          <LiveViewPanel
            server={selectedServer}
            onClose={() => setSelectedRow(null)}
            shotBase64={selectedRow ? shots[selectedRow.id] : null}
            shotUpdatedAt={selectedRow ? lastShotAt[selectedRow.id] ?? null : null}
            activityLogs={selectedRow ? logs[selectedRow.id] ?? [] : []}
            onRunCommand={(cmd) => selectedRow && sendCommand(selectedRow.id, cmd)}
            commandActionsDisabled={
              selectedRow ? isVpsCommandCoolingDown(selectedRow.id) : false
            }
          />
        </aside>
      </div>

      <VpsSettingsDialog
        target={settingsTarget}
        onClose={() => setSettingsTarget(null)}
        agentRpc={agentRpc}
      />

      <CommandFlyout
        vps={commandMenu?.vps ?? null}
        anchor={commandMenu ? { x: commandMenu.x, y: commandMenu.y } : null}
        onClose={() => setCommandMenu(null)}
        commandsDisabled={
          commandMenu ? isVpsCommandCoolingDown(commandMenu.vps.id) : false
        }
        onCommand={(cmd) => {
          if (commandMenu) {
            sendCommand(commandMenu.vps.id, cmd)
          }
        }}
      />
    </div>
  )
}
