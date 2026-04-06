"use client"

import { useEffect, useLayoutEffect, useMemo, useState } from "react"
import { Header } from "@/components/dashboard/header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import {
  GlobalControls,
  type SortKey,
  type StatusFilter,
} from "@/components/dashboard/global-controls"
import { VPSGrid } from "@/components/dashboard/vps-grid"
import { VPSList } from "@/components/dashboard/vps-list"
import { LiveViewPanel } from "@/components/dashboard/live-view-panel"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { MonitorPlay } from "lucide-react"
import { CommandFlyout } from "@/components/dashboard/command-flyout"
import { AgentConfigYamlCard } from "@/components/dashboard/agent-config-yaml-card"
import {
  VpsSettingsDialog,
  type VpsSettingsTarget,
} from "@/components/dashboard/vps-settings-dialog"
import { useVpsDashboard } from "@/hooks/use-vps-dashboard"
import { fetchSession, logoutSession } from "@/lib/api"
import type { VPS } from "@/lib/vps-data"

const LOGIN_PATH = "/dashboard/login"

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

export default function DashboardPage() {
  const [token, setToken] = useState<string | null>(null)
  const [accountUsername, setAccountUsername] = useState("")
  const [tenantId, setTenantId] = useState("")
  const [authChecked, setAuthChecked] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [settingsTarget, setSettingsTarget] = useState<VpsSettingsTarget>(null)
  const [liveSheetOpen, setLiveSheetOpen] = useState(false)
  const [isLg, setIsLg] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : false,
  )

  useLayoutEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    const onChange = () => setIsLg(mq.matches)
    onChange()
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  useLayoutEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const s = await fetchSession()
        if (cancelled) return
        if (!s) {
          setAuthChecked(true)
          window.location.replace(LOGIN_PATH)
          return
        }
        setToken(s.token)
        setAccountUsername(s.username)
        setTenantId(s.tenantId)
        setAuthChecked(true)
      } catch {
        if (!cancelled) {
          setAuthChecked(true)
          window.location.replace(LOGIN_PATH)
        }
      }
    })()
    return () => {
      cancelled = true
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
    applyAutoRestart,
    setAutoIntervalMinutes,
    isVpsCommandCoolingDown,
    isVpsScreenshotCoolingDown,
    isBulkCommandCoolingDown,
    agentRpc,
  } = useVpsDashboard(token)

  const displayedServers = useMemo(() => {
    let list = servers
    if (statusFilter !== "all") {
      list = list.filter((s) => s.status === statusFilter)
    }
    return sortServers(list, sortKey)
  }, [servers, statusFilter, sortKey])

  const selectedId = selectedRow?.id ?? null

  useEffect(() => {
    if (isLg) {
      setLiveSheetOpen(false)
      return
    }
    if (!selectedId) {
      setLiveSheetOpen(false)
      return
    }
    setLiveSheetOpen(true)
  }, [isLg, selectedId])

  const livePanelProps = {
    server: selectedServer,
    onClose: () => {
      if (isLg) {
        setSelectedRow(null)
      } else {
        setLiveSheetOpen(false)
      }
    },
    shotBase64: selectedRow ? shots[selectedRow.id] ?? null : null,
    shotUpdatedAt: selectedRow ? lastShotAt[selectedRow.id] ?? null : null,
    activityLogs: selectedRow ? logs[selectedRow.id] ?? [] : [],
    onRunCommand: (cmd: string) => {
      if (selectedRow) {
        void sendCommand(selectedRow.id, cmd)
      }
    },
    commandActionsDisabled: selectedRow
      ? isVpsCommandCoolingDown(selectedRow.id)
      : false,
    screenshotActionsDisabled: selectedRow
      ? isVpsScreenshotCoolingDown(selectedRow.id)
      : false,
  }

  const onLogout = () => {
    void (async () => {
      try {
        await logoutSession()
      } catch {
        /* ignore */
      }
      window.location.replace(LOGIN_PATH)
    })()
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
      <Header
        searchValue={search}
        onSearchChange={setSearch}
        onLogout={onLogout}
        accountUsername={accountUsername}
      />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:px-8 xl:px-10 2xl:px-12">
          <div className="w-full max-w-none space-y-6">
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

            <AgentConfigYamlCard tenantId={tenantId} />

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
              bulkActionsOnCooldown={isBulkCommandCoolingDown()}
            />

            {viewMode === "grid" ? (
              <VPSGrid
                servers={displayedServers}
                selectedId={selectedId}
                onSelect={(id) => setSelectedRow(vpsList.find((v) => v.id === id) ?? null)}
                onRunCommand={sendCommand}
                onOpenCommandMenu={openCommandMenu}
                onOpenSettings={(row, panel) => setSettingsTarget({ row, panel })}
                isVpsCommandCoolingDown={isVpsCommandCoolingDown}
              />
            ) : (
              <VPSList
                servers={displayedServers}
                selectedId={selectedId}
                onSelect={(id) => setSelectedRow(vpsList.find((v) => v.id === id) ?? null)}
                onRunCommand={sendCommand}
                onOpenCommandMenu={openCommandMenu}
                onOpenSettings={(row, panel) => setSettingsTarget({ row, panel })}
                isVpsCommandCoolingDown={isVpsCommandCoolingDown}
              />
            )}

            {totalCount === 0 && (
              <p className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
                No agents connected.
              </p>
            )}
          </div>
        </main>

        <aside className="hidden h-full w-96 shrink-0 flex-col border-l border-border bg-card lg:flex">
          <LiveViewPanel {...livePanelProps} hideSideBorder={false} />
        </aside>
      </div>

      {!isLg && selectedId && !liveSheetOpen ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="fixed bottom-4 right-4 z-40 shadow-md lg:hidden"
          onClick={() => setLiveSheetOpen(true)}
        >
          <MonitorPlay className="mr-2 size-4" aria-hidden />
          Live preview
        </Button>
      ) : null}

      {!isLg ? (
        <Sheet open={liveSheetOpen} onOpenChange={setLiveSheetOpen}>
          <SheetContent
            side="right"
            className="flex h-full w-full max-w-lg flex-col gap-0 border-0 p-0 shadow-xl data-[state=closed]:duration-200 data-[state=open]:duration-300 [&>button]:hidden sm:max-w-lg"
          >
            <SheetTitle className="sr-only">
              {selectedServer
                ? `Live preview, ${selectedServer.name}`
                : "Live preview"}
            </SheetTitle>
            <LiveViewPanel {...livePanelProps} hideSideBorder />
          </SheetContent>
        </Sheet>
      ) : null}

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
        screenshotCooldown={
          commandMenu ? isVpsScreenshotCoolingDown(commandMenu.vps.id) : false
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
