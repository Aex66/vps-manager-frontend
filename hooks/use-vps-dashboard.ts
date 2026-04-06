"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { wsUiUrl } from "@/lib/api"
import {
  describeBulkCommand,
  describeCommand,
  describeCommandRejectReason,
} from "@/lib/command-notifications"
import { downloadTextFile, sanitizeFilename } from "@/lib/downloadCookies"
import { averageCpu, mapRowToVps, type VPS } from "@/lib/vps-data"
import {
  isVpsRunning,
  type AgentRpcResultMsg,
  type VPSRow,
  type WSMsg,
} from "@/lib/types"
import { toast } from "@/hooks/use-toast"
import { getCmdSecret } from "@/lib/cmd-secret"

export type LogEntry = { t: number; message: string }

const COMMAND_COOLDOWN_MS = 2500
/** Screenshots are heavier than most agent commands; separate throttle per VPS. */
const SCREENSHOT_COOLDOWN_MS = 10_000

export function useVpsDashboard(token: string | null) {
  const [vpsList, setVpsList] = useState<VPSRow[]>([])
  const [shots, setShots] = useState<Record<string, string>>({})
  const [lastShotAt, setLastShotAt] = useState<Record<string, number>>({})
  const [selectedRow, setSelectedRow] = useState<VPSRow | null>(null)
  const [search, setSearch] = useState("")
  const [commandMenu, setCommandMenu] = useState<{
    vps: VPSRow
    x: number
    y: number
  } | null>(null)
  const [logs, setLogs] = useState<Record<string, LogEntry[]>>({})
  const [wsError, setWsError] = useState<string | null>(null)
  const [autoEnabled, setAutoEnabled] = useState(false)
  const [autoIntervalSec, setAutoIntervalSec] = useState(3600)
  const [cooldownTick, setCooldownTick] = useState(0)
  const vpsListRef = useRef<VPSRow[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const perVpsUntilRef = useRef<Record<string, number>>({})
  const perVpsScreenshotUntilRef = useRef<Record<string, number>>({})
  const bulkUntilRef = useRef(0)
  const rpcWaitersRef = useRef<
    Map<
      string,
      {
        resolve: (v: AgentRpcResultMsg) => void
        reject: (e: Error) => void
        timer: ReturnType<typeof setTimeout>
      }
    >
  >(new Map())

  const autoMinDraft = useMemo(
    () => Math.max(1, Math.round(autoIntervalSec / 60)),
    [autoIntervalSec],
  )

  useEffect(() => {
    const id = setInterval(() => setCooldownTick((n) => n + 1), 250)
    return () => clearInterval(id)
  }, [])

  const isVpsCommandCoolingDown = useCallback((vpsId: string) => {
    return Date.now() < (perVpsUntilRef.current[vpsId] ?? 0)
  }, [cooldownTick])

  const isVpsScreenshotCoolingDown = useCallback((vpsId: string) => {
    return Date.now() < (perVpsScreenshotUntilRef.current[vpsId] ?? 0)
  }, [cooldownTick])

  const isBulkCommandCoolingDown = useCallback(() => {
    return Date.now() < bulkUntilRef.current
  }, [cooldownTick])

  const appendLog = useCallback((vpsId: string, message: string) => {
    setLogs((prev) => {
      const cur = prev[vpsId] ?? []
      return {
        ...prev,
        [vpsId]: [...cur, { t: Date.now(), message }].slice(-80),
      }
    })
  }, [])

  useEffect(() => {
    vpsListRef.current = vpsList
  }, [vpsList])

  const send = useCallback((obj: object): boolean => {
    const w = wsRef.current
    if (!w || w.readyState !== WebSocket.OPEN) return false
    w.send(JSON.stringify(obj))
    return true
  }, [])

  const broadcastAgentUpdate = useCallback(() => {
    if (!send({ type: "broadcast_agent_update" })) {
      toast({
        title: "Not connected",
        description: "Dashboard WebSocket is not open. Refresh and try again.",
        variant: "destructive",
      })
      return
    }
    toast({ title: "Update check pushed to all agents" })
  }, [send])

  const sendCommand = useCallback(
    (vpsId: string, cmd: string, opts?: { bypassCooldown?: boolean }) => {
      const now = Date.now()
      if (!opts?.bypassCooldown) {
        if (cmd === "screenshot") {
          const untilShot = perVpsScreenshotUntilRef.current[vpsId] ?? 0
          if (now < untilShot) {
            const sec = Math.ceil((untilShot - now) / 1000)
            toast({
              title: "Screenshot on cooldown",
              description: `Wait ${sec}s before another capture on this VPS.`,
            })
            return
          }
          perVpsScreenshotUntilRef.current[vpsId] = now + SCREENSHOT_COOLDOWN_MS
        } else {
          const until = perVpsUntilRef.current[vpsId] ?? 0
          if (now < until) {
            const sec = Math.ceil((until - now) / 1000)
            toast({
              title: "Command on cooldown",
              description: `Wait ${sec}s before sending another command to this VPS.`,
            })
            return
          }
          perVpsUntilRef.current[vpsId] = now + COMMAND_COOLDOWN_MS
        }
        setCooldownTick((n) => n + 1)
      }
      if (
        !send({
          type: "run_command",
          vps_id: vpsId,
          cmd,
          cmd_secret: getCmdSecret(),
        })
      ) {
        if (!opts?.bypassCooldown) {
          if (cmd === "screenshot") {
            perVpsScreenshotUntilRef.current[vpsId] = 0
          } else {
            perVpsUntilRef.current[vpsId] = 0
          }
          setCooldownTick((n) => n + 1)
        }
        toast({
          title: "Not connected",
          description: "Dashboard WebSocket is not open. Check the API URL and refresh.",
        })
        return
      }
      appendLog(vpsId, `Sent: ${cmd}`)
      /* Success/error from agent: command_rejected toast, screenshot/cookies payloads, etc. */
    },
    [send, appendLog],
  )

  const broadcastCommand = useCallback(
    (cmd: string) => {
      const now = Date.now()
      if (now < bulkUntilRef.current) {
        const sec = Math.ceil((bulkUntilRef.current - now) / 1000)
        toast({
          title: "Bulk action on cooldown",
          description: `Wait ${sec}s before another Start all / Stop all / Restart all.`,
        })
        return
      }
      bulkUntilRef.current = now + COMMAND_COOLDOWN_MS
      setCooldownTick((n) => n + 1)
      if (!send({ type: "broadcast_command", cmd, cmd_secret: getCmdSecret() })) {
        bulkUntilRef.current = 0
        setCooldownTick((n) => n + 1)
        toast({
          title: "Not connected",
          description: "Dashboard WebSocket is not open. Check the API URL and refresh.",
        })
        return
      }
      appendLog("global", `Broadcast: ${cmd}`)
      toast({
        title: "Bulk action sent",
        description: describeBulkCommand(cmd),
      })
    },
    [send, appendLog],
  )

  useEffect(() => {
    if (!token) return
    const url = wsUiUrl(token)
    setWsError(null)
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => setWsError(null)
    ws.onerror = () =>
      setWsError(
        "WebSocket error: verify NEXT_PUBLIC_API_URL is reachable from this browser.",
      )

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string) as WSMsg
        if (msg.type === "vps_list") setVpsList(msg.vps)
        if (msg.type === "screenshot") {
          setShots((s) => ({ ...s, [msg.vps_id]: msg.data }))
          setLastShotAt((m) => ({ ...m, [msg.vps_id]: Date.now() }))
        }
        if (msg.type === "cookies") {
          const row = vpsListRef.current.find((x) => x.id === msg.vps_id)
          const host = row?.hostname?.trim() || msg.vps_id
          downloadTextFile(`${sanitizeFilename(host)}_cookie.txt`, msg.data)
          appendLog(msg.vps_id, "Cookies downloaded")
        }
        if (msg.type === "deadcookie") {
          const row = vpsListRef.current.find((x) => x.id === msg.vps_id)
          const host = row?.hostname?.trim() || msg.vps_id
          downloadTextFile(`${sanitizeFilename(host)}_deadcookie.txt`, msg.data)
          appendLog(msg.vps_id, "Deadcookie downloaded")
        }
        if (msg.type === "auto_restart_state") {
          setAutoEnabled(msg.enabled)
          setAutoIntervalSec(msg.interval_sec)
        }
        if (msg.type === "agent_rpc_result") {
          const w = rpcWaitersRef.current.get(msg.request_id)
          if (w) {
            clearTimeout(w.timer)
            rpcWaitersRef.current.delete(msg.request_id)
            if (msg.ok) w.resolve(msg)
            else w.reject(new Error(msg.error || "Agent error"))
          }
        }
        if (msg.type === "command_rejected") {
          const row = vpsListRef.current.find((x) => x.id === msg.vps_id)
          const host = row?.hostname?.trim() || msg.vps_id
          const why = describeCommandRejectReason(msg.reason)
          appendLog(
            msg.vps_id,
            `Rejected: ${describeCommand(msg.cmd)} — ${msg.reason}`,
          )
          toast({
            title: "Command rejected",
            description: `${describeCommand(msg.cmd)} · ${host}: ${why}`,
            variant: "destructive",
          })
        }
      } catch {
        /* ignore */
      }
    }

    ws.onclose = () => {
      if (wsRef.current === ws) wsRef.current = null
    }

    return () => {
      ws.close()
    }
  }, [token, appendLog])

  const applyAutoRestart = useCallback(
    (enabled: boolean) => {
      send({
        type: "set_auto_restart",
        enabled,
        interval_sec: autoIntervalSec,
      })
    },
    [send, autoIntervalSec],
  )

  const setAutoIntervalMinutes = useCallback(
    (min: number) => {
      const sec = Math.max(60, min * 60)
      setAutoIntervalSec(sec)
      send({
        type: "set_auto_restart",
        enabled: autoEnabled,
        interval_sec: sec,
      })
    },
    [send, autoEnabled],
  )

  useEffect(() => {
    const id = selectedRow?.id
    if (!id) return
    const next = vpsList.find((x) => x.id === id)
    if (next) setSelectedRow(next)
    else setSelectedRow(null)
  }, [vpsList, selectedRow?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return vpsList
    return vpsList.filter(
      (v) =>
        v.hostname.toLowerCase().includes(q) ||
        v.id.toLowerCase().includes(q) ||
        (v.local_ip && v.local_ip.toLowerCase().includes(q)),
    )
  }, [vpsList, search])

  const servers: VPS[] = useMemo(
    () => filteredRows.map(mapRowToVps),
    [filteredRows],
  )

  const allServers: VPS[] = useMemo(() => vpsList.map(mapRowToVps), [vpsList])

  const runningCount = useMemo(() => vpsList.filter(isVpsRunning).length, [vpsList])

  const avgCpu = useMemo(() => averageCpu(allServers), [allServers])

  const openCommandMenu = useCallback((vps: VPSRow, anchor: { x: number; y: number }) => {
    setCommandMenu({ vps, x: anchor.x, y: anchor.y })
  }, [])

  const agentRpc = useCallback(
    (vpsId: string, payload: Record<string, unknown>) => {
      return new Promise<AgentRpcResultMsg>((resolve, reject) => {
        const request_id =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`
        const timer = setTimeout(() => {
          if (rpcWaitersRef.current.has(request_id)) {
            rpcWaitersRef.current.delete(request_id)
            reject(new Error("Request timed out"))
          }
        }, 90_000)
        rpcWaitersRef.current.set(request_id, { resolve, reject, timer })
        const sent = send({
          type: "agent_rpc",
          vps_id: vpsId,
          request_id,
          cmd_secret: getCmdSecret(),
          ...payload,
        })
        if (!sent) {
          clearTimeout(timer)
          rpcWaitersRef.current.delete(request_id)
          reject(new Error("Not connected"))
        }
      })
    },
    [send],
  )

  const selectedServer: VPS | null = useMemo(
    () => (selectedRow ? mapRowToVps(selectedRow) : null),
    [selectedRow],
  )

  return {
    vpsList,
    servers,
    allServers,
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
    send,
    sendCommand,
    broadcastCommand,
    appendLog,
    openCommandMenu,
    runningCount,
    avgCpu,
    totalCount: vpsList.length,
    autoEnabled,
    autoMinDraft,
    autoIntervalSec,
    applyAutoRestart,
    setAutoIntervalMinutes,
    isVpsCommandCoolingDown,
    isVpsScreenshotCoolingDown,
    isBulkCommandCoolingDown,
    agentRpc,
    broadcastAgentUpdate,
  }
}
