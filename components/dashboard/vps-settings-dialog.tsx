"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { AgentRpcResultMsg, VPSRow, VpsSettingsPanel } from "@/lib/types"
import { vpsDisplayName } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

const VOLT_FOLDERS = ["autoexec", "workspace", "scripts"] as const
type VoltFolder = (typeof VOLT_FOLDERS)[number]

export type VpsSettingsTarget = {
  row: VPSRow
  panel: VpsSettingsPanel
} | null

type Props = {
  target: VpsSettingsTarget
  onClose: () => void
  agentRpc: (
    vpsId: string,
    payload: Record<string, unknown>,
  ) => Promise<AgentRpcResultMsg>
}

export function VpsSettingsDialog({ target, onClose, agentRpc }: Props) {
  const open = target != null
  const row = target?.row ?? null
  const panel = target?.panel

  const [yummyText, setYummyText] = useState("")
  const [yummyLoading, setYummyLoading] = useState(false)
  const [yummySaving, setYummySaving] = useState(false)

  const [voltFolder, setVoltFolder] = useState<VoltFolder>("autoexec")
  const [voltFiles, setVoltFiles] = useState<string[]>([])
  const [voltPath, setVoltPath] = useState<string | null>(null)
  const [voltText, setVoltText] = useState("")
  const [voltListLoading, setVoltListLoading] = useState(false)
  const [voltFileLoading, setVoltFileLoading] = useState(false)
  const [voltSaving, setVoltSaving] = useState(false)

  const resetYummy = useCallback(() => {
    setYummyText("")
    setYummyLoading(false)
    setYummySaving(false)
  }, [])

  const resetVolt = useCallback(() => {
    setVoltFolder("autoexec")
    setVoltFiles([])
    setVoltPath(null)
    setVoltText("")
    setVoltListLoading(false)
    setVoltFileLoading(false)
    setVoltSaving(false)
  }, [])

  useEffect(() => {
    if (!open) {
      resetYummy()
      resetVolt()
      return
    }
    if (panel === "volt") resetYummy()
    else if (panel === "yummy_config" || panel === "yummy_auth")
      resetVolt()
  }, [open, panel, resetYummy, resetVolt])

  useEffect(() => {
    if (!row || (panel !== "yummy_config" && panel !== "yummy_auth")) return

    let cancelled = false
    setYummyLoading(true)
    const op = panel === "yummy_config" ? "read_yummy_config" : "read_yummy_auth"
    ;(async () => {
      try {
        const r = await agentRpc(row.id, { op })
        if (cancelled) return
        if (r.ok && r.content != null) setYummyText(r.content)
        else {
          toast({
            title: "Could not read file",
            description: r.error || "Unknown error",
            variant: "destructive",
          })
          setYummyText("")
        }
      } catch (e) {
        if (!cancelled) {
          toast({
            title: "Could not read file",
            description: e instanceof Error ? e.message : "Error",
            variant: "destructive",
          })
          setYummyText("")
        }
      } finally {
        if (!cancelled) setYummyLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [row?.id, panel, agentRpc])

  const refreshVoltList = useCallback(async () => {
    if (!row || panel !== "volt") return
    setVoltListLoading(true)
    try {
      const r = await agentRpc(row.id, {
        op: "list_volt",
        folder: voltFolder,
      })
      if (r.ok && Array.isArray(r.files)) {
        setVoltFiles(
          r.files.filter((f) => f.startsWith(`${voltFolder}/`)),
        )
      } else {
        setVoltFiles([])
        toast({
          title: "Could not list Volt folder",
          description: r.error || "Unknown error",
          variant: "destructive",
        })
      }
    } catch (e) {
      setVoltFiles([])
      toast({
        title: "Could not list Volt folder",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      })
    } finally {
      setVoltListLoading(false)
    }
  }, [row?.id, panel, voltFolder, agentRpc])

  useEffect(() => {
    if (!row || panel !== "volt") return
    refreshVoltList()
  }, [row?.id, panel, voltFolder, refreshVoltList])

  useEffect(() => {
    if (!row || panel !== "volt") return
    if (!voltPath || !voltPath.startsWith(`${voltFolder}/`)) {
      setVoltText("")
      return
    }
    let cancelled = false
    setVoltFileLoading(true)
    ;(async () => {
      try {
        const r = await agentRpc(row.id, { op: "read_volt", path: voltPath })
        if (cancelled) return
        if (r.ok && r.content != null) setVoltText(r.content)
        else {
          setVoltText("")
          toast({
            title: "Could not read file",
            description: r.error || "Unknown error",
            variant: "destructive",
          })
        }
      } catch (e) {
        if (!cancelled) {
          setVoltText("")
          toast({
            title: "Could not read file",
            description: e instanceof Error ? e.message : "Error",
            variant: "destructive",
          })
        }
      } finally {
        if (!cancelled) setVoltFileLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [row?.id, panel, voltPath, agentRpc, voltFolder])

  const saveYummy = async () => {
    if (!row || (panel !== "yummy_config" && panel !== "yummy_auth")) return
    const op =
      panel === "yummy_config" ? "write_yummy_config" : "write_yummy_auth"
    setYummySaving(true)
    try {
      const r = await agentRpc(row.id, { op, content: yummyText })
      if (r.ok) toast({ title: "Saved" })
      else
        toast({
          title: "Save failed",
          description: r.error,
          variant: "destructive",
        })
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      })
    } finally {
      setYummySaving(false)
    }
  }

  const saveVolt = async () => {
    if (!row || !voltPath) return
    setVoltSaving(true)
    try {
      const r = await agentRpc(row.id, {
        op: "write_volt",
        path: voltPath,
        content: voltText,
      })
      if (r.ok) toast({ title: "Saved" })
      else
        toast({
          title: "Save failed",
          description: r.error,
          variant: "destructive",
        })
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      })
    } finally {
      setVoltSaving(false)
    }
  }

  const deleteVolt = async () => {
    if (!row || !voltPath) return
    if (!window.confirm(`Delete ${voltPath}?`)) return
    try {
      const r = await agentRpc(row.id, { op: "delete_volt", path: voltPath })
      if (r.ok) {
        toast({ title: "Deleted" })
        setVoltPath(null)
        setVoltText("")
        await refreshVoltList()
      } else
        toast({
          title: "Delete failed",
          description: r.error,
          variant: "destructive",
        })
    } catch (e) {
      toast({
        title: "Delete failed",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      })
    }
  }

  const newVoltFile = async () => {
    if (!row) return
    const name = window.prompt(
      `New file in ${voltFolder} (e.g. script.lua, notes.txt):`,
    )
    if (!name?.trim()) return
    const base = name.trim().replace(/^[\\/]+/, "").replace(/\\/g, "/")
    if (!base || base.includes("/") || base.includes("..")) {
      toast({
        title: "Invalid name",
        description: "Use a single file name only.",
        variant: "destructive",
      })
      return
    }
    const path = `${voltFolder}/${base}`
    try {
      const r = await agentRpc(row.id, {
        op: "write_volt",
        path,
        content: "",
      })
      if (r.ok) {
        toast({ title: "File created" })
        await refreshVoltList()
        setVoltPath(path)
        setVoltText("")
      } else
        toast({
          title: "Could not create file",
          description: r.error,
          variant: "destructive",
        })
    } catch (e) {
      toast({
        title: "Could not create file",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      })
    }
  }

  const title =
    panel === "yummy_config"
      ? "Yummy config (config.json)"
      : panel === "yummy_auth"
        ? "Yummy auth (auth.json)"
        : panel === "volt"
          ? "Volt files (%LOCALAPPDATA%\\Volt)"
          : "Settings"

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
    >
      <DialogContent className="z-[200] flex max-h-[90vh] max-w-3xl flex-col gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="text-left">
            {row ? `${title} — ${vpsDisplayName(row)}` : title}
          </DialogTitle>
        </DialogHeader>

        {(panel === "yummy_config" || panel === "yummy_auth") && row && (
          <div className="flex min-h-0 flex-1 flex-col gap-3 px-6 py-4">
            {yummyLoading ? (
              <div className="flex justify-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <textarea
                className={cn(
                  "min-h-64 flex-1 resize-y rounded-md border border-border bg-background",
                  "font-mono text-sm text-foreground",
                  "p-3 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                )}
                value={yummyText}
                onChange={(e) => setYummyText(e.target.value)}
                spellCheck={false}
              />
            )}
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button
                type="button"
                onClick={saveYummy}
                disabled={yummyLoading || yummySaving}
              >
                {yummySaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        )}

        {panel === "volt" && row && (
          <div className="flex min-h-[420px] flex-1 flex-col gap-3 px-6 py-4">
            <Tabs
              value={voltFolder}
              onValueChange={(v) => {
                setVoltFolder(v as VoltFolder)
                setVoltPath(null)
                setVoltText("")
              }}
            >
              <TabsList className="w-full justify-start">
                {VOLT_FOLDERS.map((f) => (
                  <TabsTrigger key={f} value={f} className="capitalize">
                    {f}
                  </TabsTrigger>
                ))}
              </TabsList>
              {VOLT_FOLDERS.map((f) => (
                <TabsContent
                  key={f}
                  value={f}
                  className="mt-3 flex min-h-0 flex-1 gap-3 data-[state=inactive]:hidden"
                >
                  <div className="flex w-44 shrink-0 flex-col gap-2">
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => refreshVoltList()}
                        disabled={voltListLoading}
                      >
                        Refresh
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={newVoltFile}
                      >
                        New
                      </Button>
                    </div>
                    <ScrollArea className="h-64 rounded-md border border-border">
                      <div className="p-1">
                        {voltListLoading ? (
                          <div className="flex justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : voltFiles.length === 0 ? (
                          <p className="px-2 py-3 text-xs text-muted-foreground">
                            No files
                          </p>
                        ) : (
                          voltFiles.map((pathStr) => {
                            const short = pathStr.replace(`${f}/`, "")
                            return (
                              <button
                                key={pathStr}
                                type="button"
                                onClick={() => setVoltPath(pathStr)}
                                className={cn(
                                  "w-full rounded px-2 py-1.5 text-left font-mono text-xs",
                                  "hover:bg-accent hover:text-accent-foreground",
                                  voltPath === pathStr &&
                                    "bg-accent text-accent-foreground",
                                )}
                              >
                                {short}
                              </button>
                            )
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    {voltFileLoading ? (
                      <div className="flex flex-1 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <textarea
                        className={cn(
                          "min-h-64 flex-1 resize-y rounded-md border border-border bg-background",
                          "font-mono text-sm text-foreground",
                          "p-3 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                        )}
                        value={voltText}
                        onChange={(e) => setVoltText(e.target.value)}
                        placeholder={
                          voltPath
                            ? undefined
                            : "Select a file or create a new one"
                        }
                        disabled={!voltPath}
                        spellCheck={false}
                      />
                    )}
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={!voltPath || voltFileLoading}
                        onClick={deleteVolt}
                      >
                        Delete
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={saveVolt}
                        disabled={!voltPath || voltFileLoading || voltSaving}
                      >
                        {voltSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
