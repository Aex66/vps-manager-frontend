export type VPSRow = {
  id: string
  hostname: string
  /** Windows MachineGuid / Linux machine-id when agent sends it */
  machine_id?: string
  connected: boolean
  last_seen: number
  has_metrics?: boolean
  cpu_percent?: number
  cores?: number
  threads?: number
  volt_running?: boolean
  webrb_running?: boolean
  local_ip?: string
  uptime_sec?: number
  net_sent_mbps?: number
  net_recv_mbps?: number
  /** Windows: count of RobloxPlayerBeta.exe processes */
  roblox_instances?: number
}

export type AgentRpcResultMsg = {
  type: "agent_rpc_result"
  vps_id: string
  request_id: string
  ok: boolean
  error?: string
  content?: string
  files?: string[]
}

export type WSMsg =
  | { type: "vps_list"; vps: VPSRow[] }
  | { type: "screenshot"; vps_id: string; data: string }
  | { type: "cookies"; vps_id: string; data: string }
  | AgentRpcResultMsg
  | {
      type: "auto_restart_state"
      enabled: boolean
      interval_sec: number
      screenshot_interval: number
    }
  | { type: "config_snapshot_interval"; seconds: number }

export type VpsSettingsPanel =
  | "yummy_config"
  | "yummy_auth"
  | "yummy_cookie"
  | "volt"

export const COMMANDS = [
  { id: "refresh_all", label: "Refresh All" },
  { id: "restart_yummy", label: "Restart Yummy" },
  { id: "kill_yummy", label: "Kill Yummy" },
  { id: "start_yummy", label: "Start Yummy" },
  { id: "kill_executor", label: "Kill Executor (Volt)" },
  { id: "start_executor", label: "Start Executor (Volt)" },
  { id: "restart_executor", label: "Restart Executor (Volt)" },
  { id: "kill_roblox", label: "Kill Roblox" },
  { id: "grab_cookies", label: "Grab All Cookies" },
  { id: "screenshot", label: "Screenshot" },
] as const

export type CommandId = (typeof COMMANDS)[number]["id"]

export function vpsDisplayName(v: VPSRow): string {
  return v.hostname?.trim() || v.id
}

/** Running only if both Volt (tauri-app) and WebRB are running. */
export function isVpsRunning(v: VPSRow): boolean {
  return Boolean(v.volt_running && v.webrb_running)
}
