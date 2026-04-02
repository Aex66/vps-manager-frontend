import type { VPSRow } from "@/lib/types"
import { isVpsRunning, vpsDisplayName } from "@/lib/types"

export function formatUptime(sec: number | undefined): string {
  if (sec == null || sec < 0) return "—"
  const s = Math.floor(sec)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return "<1m"
}

export interface VPS {
  id: string
  name: string
  status: "running" | "stopped" | "restarting"
  ip: string
  cpu: number
  /** Roblox player processes (from agent metrics) */
  robloxInstances: number
  storage: number
  uptime: string
  /** Set when this row comes from a live agent (`vps_list`). */
  agentRow?: VPSRow
}

export function mapRowToVps(row: VPSRow): VPS {
  const running = isVpsRunning(row)
  const partial = Boolean(row.volt_running || row.webrb_running) && !running
  const status: VPS["status"] = running ? "running" : partial ? "restarting" : "stopped"
  return {
    id: row.id,
    name: vpsDisplayName(row),
    status,
    ip: row.local_ip?.trim() || "—",
    cpu:
      row.has_metrics && typeof row.cpu_percent === "number"
        ? Math.round(row.cpu_percent)
        : 0,
    robloxInstances:
      row.has_metrics && typeof row.roblox_instances === "number"
        ? row.roblox_instances
        : 0,
    storage: 0,
    uptime: formatUptime(row.uptime_sec),
    agentRow: row,
  }
}

export function averageCpu(servers: VPS[]): number {
  const withCpu = servers.filter((s) => s.cpu > 0)
  if (withCpu.length === 0) return 0
  return Math.round(withCpu.reduce((a, s) => a + s.cpu, 0) / withCpu.length)
}
