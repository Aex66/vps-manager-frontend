"use client"

import { useRef, useState } from "react"
import {
  RefreshCw,
  Power,
  LayoutGrid,
  List,
  Filter,
  ArrowUpDown,
  Upload,
  Download,
  Loader2,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import { downloadAgentBundleBlob, uploadAgentBundle } from "@/lib/api"

export type StatusFilter = "all" | "running" | "stopped" | "restarting"
export type SortKey = "name" | "status" | "cpu" | "memory"

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
  screenshotIntervalSec: number
  onScreenshotIntervalChange: (seconds: number) => void
  /** True while bulk Start/Stop/Restart all are on cooldown */
  bulkActionsOnCooldown: boolean
  /** JWT for admin API (agent bundle upload/download). */
  authToken: string
  /** Ask all connected agents to check for an update immediately (WebSocket). */
  onPushAgentUpdate: () => void
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
  screenshotIntervalSec,
  onScreenshotIntervalChange,
  bulkActionsOnCooldown,
  authToken,
  onPushAgentUpdate,
}: GlobalControlsProps) {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadVersion, setUploadVersion] = useState("")
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const pickRef = useRef<HTMLInputElement>(null)

  const onPickFile = () => pickRef.current?.click()

  const onSubmitUpload = async () => {
    const v = uploadVersion.trim()
    if (!v || !uploadFile) {
      toast({
        title: "Version and zip file required",
        variant: "destructive",
      })
      return
    }
    setUploading(true)
    try {
      await uploadAgentBundle(authToken, v, uploadFile)
      toast({ title: "Agent bundle uploaded" })
      setUploadOpen(false)
      setUploadVersion("")
      setUploadFile(null)
      if (pickRef.current) pickRef.current.value = ""
    } catch (e) {
      toast({
        title: "Upload failed",
        description: String(e),
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const onDownloadBundle = async () => {
    setDownloading(true)
    try {
      const blob = await downloadAgentBundleBlob(authToken)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "agent_update.zip"
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: "Download started" })
    } catch (e) {
      toast({
        title: "Download failed",
        description: String(e),
        variant: "destructive",
      })
    } finally {
      setDownloading(false)
    }
  }

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
          <input
            ref={pickRef}
            type="file"
            accept=".zip,application/zip"
            className="hidden"
            onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="border-border"
            title="Upload agent update (zip)"
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="border-border"
            title="Download agent bundle"
            disabled={downloading}
            onClick={() => void onDownloadBundle()}
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="border-border"
            title="Push update check to all agents now"
            onClick={onPushAgentUpdate}
          >
            <Zap className="h-4 w-4" />
          </Button>
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload agent bundle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="agent-ver">Version (semver)</Label>
                  <Input
                    id="agent-ver"
                    placeholder="e.g. 1.2.0"
                    value={uploadVersion}
                    onChange={(e) => setUploadVersion(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Zip file</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={onPickFile}>
                      Choose file
                    </Button>
                    <span className="text-muted-foreground truncate text-sm">
                      {uploadFile ? uploadFile.name : "No file selected"}
                    </span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" disabled={uploading} onClick={() => void onSubmitUpload()}>
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    "Upload"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
              <DropdownMenuItem onClick={() => onSortKeyChange("memory")}>
                Memory Usage
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
        <div className="flex items-center gap-2">
          <Label
            htmlFor="shot-interval"
            className="text-muted-foreground text-sm whitespace-nowrap"
          >
            Screenshot interval (s)
          </Label>
          <Input
            id="shot-interval"
            type="number"
            min={3}
            className="h-8 w-16 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            value={screenshotIntervalSec}
            onChange={(e) => onScreenshotIntervalChange(Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  )
}
