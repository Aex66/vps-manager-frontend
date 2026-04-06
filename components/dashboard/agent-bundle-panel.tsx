"use client"

import { useRef, useState } from "react"
import { Upload, Download, Loader2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { downloadAgentBundleBlob, uploadAgentBundle } from "@/lib/api"

export type AgentBundlePanelProps = {
  authToken: string
  onPushAgentUpdate: () => void
}

export function AgentBundlePanel({ authToken, onPushAgentUpdate }: AgentBundlePanelProps) {
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
    <section
      id="agent-software"
      className="rounded-lg border border-border bg-card/50 p-4 sm:p-5"
    >
      <div className="mb-5 max-w-2xl space-y-1">
        <h2 className="text-lg font-semibold text-foreground">Agent software</h2>
        <p className="text-sm text-muted-foreground">
          Applies to <strong>every</strong> tenant: the bundle agents download when they update. Use it
          alongside tenant secrets above — not a replacement for per-tenant agent secrets.
        </p>
      </div>

      <input
        ref={pickRef}
        type="file"
        accept=".zip,application/zip"
        className="hidden"
        onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-background/60 p-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
              <Upload className="h-5 w-5 text-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-foreground">Upload a new bundle</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Publish a versioned zip. Agents pick it up after a refresh or when you push an update
                check.
              </p>
            </div>
          </div>
          <Button type="button" variant="secondary" className="mt-auto w-full" onClick={() => setUploadOpen(true)}>
            Upload zip…
          </Button>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border bg-background/60 p-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
              <Download className="h-5 w-5 text-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-foreground">Download current bundle</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Save the latest <span className="font-mono">agent_update.zip</span> for testing or offline
                distribution.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="mt-auto w-full"
            disabled={downloading}
            onClick={() => void onDownloadBundle()}
          >
            {downloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing…
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download
              </>
            )}
          </Button>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border bg-background/60 p-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
              <Zap className="h-5 w-5 text-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-foreground">Ping connected agents</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Tells agents that are online to check the manifest now (same as the dashboard broadcast).
              </p>
            </div>
          </div>
          <Button type="button" variant="secondary" className="mt-auto w-full" onClick={onPushAgentUpdate}>
            <Zap className="mr-2 h-4 w-4" />
            Push update check
          </Button>
        </div>
      </div>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload agent bundle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="agent-ver-admin">Version (semver)</Label>
              <Input
                id="agent-ver-admin"
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
    </section>
  )
}
