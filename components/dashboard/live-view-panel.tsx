"use client"

import { useEffect, useState, useMemo } from "react"
import {
  X,
  Terminal,
  HardDrive,
  Cpu,
  Network,
  Clock,
  Play,
  Square,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { VPS, formatUptime } from "@/lib/vps-data"
import { cn } from "@/lib/utils"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import type { LogEntry } from "@/hooks/use-vps-dashboard"

interface LiveViewPanelProps {
  server: VPS | null
  onClose: () => void
  shotBase64?: string | null
  shotUpdatedAt?: number | null
  activityLogs?: LogEntry[]
  onRunCommand: (cmd: string) => void
  /** Disables Start/Stop/Restart/Screenshot while per-VPS command cooldown is active */
  commandActionsDisabled?: boolean
}

function generateChartData(seedCpu: number) {
  const base = Math.min(95, Math.max(5, seedCpu || 30))
  return Array.from({ length: 20 }, (_, i) => ({
    time: `${i}s`,
    cpu: Math.min(100, Math.max(0, Math.floor(base + (Math.sin(i / 3) * 8 + (i % 5) * 2) % 25))),
    memory: Math.min(
      100,
      Math.max(0, Math.floor(40 + base * 0.4 + ((i * 7) % 18))),
    ),
  }))
}

function MetricRow({
  icon,
  label,
  value,
  subValue,
}: {
  icon: React.ReactNode
  label: string
  value: string
  subValue?: string
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="text-muted-foreground">{icon}</div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="text-right">
        <span className="text-sm font-medium text-foreground">{value}</span>
        {subValue && (
          <span className="ml-2 text-xs text-muted-foreground">{subValue}</span>
        )}
      </div>
    </div>
  )
}

function LogLine({
  time,
  message,
  type,
}: {
  time: string
  message: string
  type: "info" | "success" | "warning"
}) {
  return (
    <div className="flex gap-2 font-mono text-xs">
      <span className="text-muted-foreground">{time}</span>
      <span
        className={cn({
          "text-foreground": type === "info",
          "text-success": type === "success",
          "text-warning": type === "warning",
        })}
      >
        {message}
      </span>
    </div>
  )
}

export function LiveViewPanel({
  server,
  onClose,
  shotBase64,
  shotUpdatedAt,
  activityLogs = [],
  onRunCommand,
  commandActionsDisabled = false,
}: LiveViewPanelProps) {
  const row = server?.agentRow
  const seedCpu = row?.has_metrics && typeof row.cpu_percent === "number" ? row.cpu_percent : server?.cpu ?? 30

  const [chartData, setChartData] = useState(() => generateChartData(seedCpu))

  useEffect(() => {
    setChartData(generateChartData(seedCpu))
  }, [server?.id, seedCpu])

  useEffect(() => {
    if (!server || server.status !== "running") return

    const interval = setInterval(() => {
      setChartData((prev) => {
        const newData = [...prev.slice(1)]
        const last = prev[prev.length - 1]
        const cpu = Math.min(
          100,
          Math.max(
            0,
            Math.floor(seedCpu + (Math.random() * 16 - 8)),
          ),
        )
        newData.push({
          time: `${parseInt(last.time, 10) + 1}s`,
          cpu,
          memory: Math.min(100, Math.max(0, last.memory + Math.floor(Math.random() * 6 - 3))),
        })
        return newData
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [server, seedCpu])

  const ageSec = useMemo(() => {
    if (!shotUpdatedAt) return null
    return Math.max(0, Math.floor((Date.now() - shotUpdatedAt) / 1000))
  }, [shotUpdatedAt])

  if (!server) {
    return (
      <div className="flex h-full flex-col items-center justify-center border-l border-border bg-card p-8 text-center">
        <div className="mb-4 rounded-full bg-secondary p-4">
          <Terminal className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-medium text-foreground">No Server Selected</h3>
        <p className="text-sm text-muted-foreground">
          Select a server from the grid to view live metrics and controls
        </p>
      </div>
    )
  }

  const hasMetrics = row?.has_metrics === true
  const cpuPct =
    hasMetrics && typeof row?.cpu_percent === "number" ? row.cpu_percent : server.cpu
  const cores = hasMetrics && typeof row?.cores === "number" ? row.cores : null
  const threads = hasMetrics && typeof row?.threads === "number" ? row.threads : null
  const sent = row?.net_sent_mbps
  const recv = row?.net_recv_mbps
  const showNet = hasMetrics && (sent != null || recv != null)

  const logsForUi = activityLogs.slice(-20).map((l) => ({
    time: new Date(l.t).toLocaleTimeString(undefined, { hour12: false }),
    message: l.message,
    type: l.message.includes("error") || l.message.includes("Error")
      ? ("warning" as const)
      : l.message.includes("downloaded") || l.message.includes("Sent")
        ? ("success" as const)
        : ("info" as const),
  }))

  return (
    <div className="flex h-full flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className={cn("h-2.5 w-2.5 rounded-full", {
              "bg-success animate-pulse": server.status === "running",
              "bg-muted-foreground": server.status === "stopped",
              "bg-warning animate-pulse": server.status === "restarting",
            })}
          />
          <div>
            <h2 className="font-medium text-foreground">{server.name}</h2>
            <p className="text-xs text-muted-foreground">
              {row?.local_ip?.trim() || server.ip}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-border p-4">
          <p className="mb-2 text-xs font-medium text-foreground">Screen preview</p>
          <div className="mb-2 aspect-video overflow-hidden rounded-md border border-border bg-secondary">
            {shotBase64 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`data:image/png;base64,${shotBase64}`}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 px-4 text-center">
                <p className="text-xs text-muted-foreground">No screenshot yet.</p>
                <Button
                  size="sm"
                  variant="secondary"
                  type="button"
                  disabled={commandActionsDisabled}
                  onClick={() => onRunCommand("screenshot")}
                >
                  Capture now
                </Button>
              </div>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {shotBase64
              ? ageSec == null
                ? "Live desktop"
                : `Updated ${ageSec}s ago`
              : "Request a capture to see the VPS desktop here (not shown on the grid)."}
          </p>
        </div>

        <div className="border-b border-border p-4">
          <div className="flex flex-wrap gap-2">
            {server.status === "stopped" ? (
              <Button
                size="sm"
                className="gap-2 bg-success text-success-foreground hover:bg-success/90"
                disabled={commandActionsDisabled}
                onClick={() => onRunCommand("refresh_all")}
              >
                <Play className="h-4 w-4" /> Start
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                disabled={commandActionsDisabled}
                onClick={() => onRunCommand("stop_vps")}
              >
                <Square className="h-4 w-4" /> Stop
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={commandActionsDisabled}
              onClick={() => onRunCommand("refresh_all")}
            >
              <RotateCcw className="h-4 w-4" /> Restart
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={commandActionsDisabled}
              onClick={() => onRunCommand("screenshot")}
            >
              <Terminal className="h-4 w-4" /> Screenshot
            </Button>
          </div>
        </div>

        {server.status === "running" && (
          <div className="border-b border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Live Metrics</span>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-chart-1" />
                  <span className="text-muted-foreground">CPU</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-chart-2" />
                  <span className="text-muted-foreground">Memory</span>
                </div>
              </div>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.7 0.15 160)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.7 0.15 160)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.65 0.18 250)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.65 0.18 250)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.12 0 0)",
                      border: "1px solid oklch(0.22 0 0)",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "oklch(0.95 0 0)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cpu"
                    stroke="oklch(0.7 0.15 160)"
                    fill="url(#cpuGradient)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="memory"
                    stroke="oklch(0.65 0.18 250)"
                    fill="url(#memoryGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="border-b border-border px-4">
          <MetricRow
            icon={<Cpu className="h-4 w-4" />}
            label="CPU Usage"
            value={`${Math.round(cpuPct)}%`}
            subValue={server.status === "running" && cores != null ? `${cores} cores` : undefined}
          />
          <MetricRow
            icon={<HardDrive className="h-4 w-4" />}
            label="Logical CPUs"
            value={threads != null ? String(threads) : "—"}
            subValue="threads"
          />
          <MetricRow
            icon={<Network className="h-4 w-4" />}
            label="Network"
            value={
              showNet
                ? `↑ ${(sent ?? 0).toFixed(1)} ↓ ${(recv ?? 0).toFixed(1)} Mbps`
                : "—"
            }
          />
          <MetricRow
            icon={<Clock className="h-4 w-4" />}
            label="Uptime"
            value={formatUptime(row?.uptime_sec)}
            subValue="System boot time"
          />
        </div>

        <div className="border-b border-border p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">Server Info</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">ID</span>
              <span className="font-mono text-foreground text-right break-all">{server.id}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Hostname</span>
              <span className="font-mono text-foreground text-right break-all">
                {row?.hostname ?? "—"}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Local IP</span>
              <span className="font-mono text-foreground text-right break-all">
                {row?.local_ip?.trim() || "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Recent activity</h3>
          </div>
          <div className="space-y-1.5 rounded-lg bg-secondary/50 p-3">
            {logsForUi.length === 0 && (
              <p className="text-xs text-muted-foreground">No events yet.</p>
            )}
            {logsForUi.map((log, index) => (
              <LogLine key={`${log.time}-${index}`} {...log} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
