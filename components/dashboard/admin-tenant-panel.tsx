"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { Building2, KeyRound, Loader2, Plus, TextCursorInput } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import {
  createAdminTenant,
  getAdminTenant,
  listAdminTenants,
  patchAdminTenant,
  type AdminTenant,
} from "@/lib/api"
import { copyTextToClipboard } from "@/lib/copy-text"
import { generateRandomCmdSecret as generateRandomAgentSecret } from "@/lib/cmd-secret"
import { cn } from "@/lib/utils"

type AdminTenantPanelProps = {
  authToken: string
  onTenantsChange?: () => void
}

export function AdminTenantPanel({ authToken, onTenantsChange }: AdminTenantPanelProps) {
  const [listLoading, setListLoading] = useState(true)
  const [tenants, setTenants] = useState<AdminTenant[]>([])
  const [selectedId, setSelectedId] = useState<string>("")
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [secretConfigured, setSecretConfigured] = useState(false)
  const [newSecret, setNewSecret] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [newId, setNewId] = useState("")
  const [newName, setNewName] = useState("")
  const [newAgentSecret, setNewAgentSecret] = useState("")

  const selectedTenantReqRef = useRef(selectedId)
  selectedTenantReqRef.current = selectedId

  const loadList = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true
    if (!silent) setListLoading(true)
    try {
      const list = await listAdminTenants(authToken)
      setTenants(list)
      setSelectedId((prev) => {
        if (!list.length) return ""
        if (prev && list.some((t) => t.id === prev)) return prev
        return list[0].id
      })
    } catch (e) {
      toast({
        title: "Could not load tenants",
        description: String(e),
        variant: "destructive",
      })
    } finally {
      if (!silent) setListLoading(false)
    }
  }, [authToken])

  useEffect(() => {
    void loadList()
  }, [loadList])

  const loadDetail = useCallback(async () => {
    if (!selectedId) return
    const reqId = selectedId
    try {
      const t = await getAdminTenant(authToken, reqId)
      if (selectedTenantReqRef.current !== reqId) return
      setName(t.name)
      setSecretConfigured(t.agent_secret_configured)
      setNewSecret("")
    } catch (e) {
      if (selectedTenantReqRef.current !== reqId) return
      toast({
        title: "Could not load tenant",
        description: String(e),
        variant: "destructive",
      })
    } finally {
      if (selectedTenantReqRef.current === reqId) {
        setDetailLoading(false)
      }
    }
  }, [authToken, selectedId])

  /** Turn on loading overlay before paint so we never flash wrong tenant row or shrink the panel. */
  useLayoutEffect(() => {
    if (selectedId) setDetailLoading(true)
    else setDetailLoading(false)
  }, [selectedId])

  useEffect(() => {
    void loadDetail()
  }, [loadDetail])

  const onSave = async () => {
    if (!selectedId) return
    const body: { name: string; agent_secret?: string } = { name: name.trim() }
    const sec = newSecret.trim()
    if (sec) body.agent_secret = sec
    setSaving(true)
    try {
      const t = await patchAdminTenant(authToken, selectedId, body)
      setName(t.name)
      setSecretConfigured(t.agent_secret_configured)
      setNewSecret("")
      await loadList({ silent: true })
      toast({ title: "Tenant settings saved" })
    } catch (e) {
      toast({
        title: "Save failed",
        description: String(e),
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const onCreateTenant = async () => {
    const id = newId.trim()
    const sec = newAgentSecret.trim()
    if (!id || !sec) {
      toast({ title: "Tenant id and agent secret are required", variant: "destructive" })
      return
    }
    try {
      await createAdminTenant(authToken, {
        id,
        name: newName.trim(),
        agent_secret: sec,
      })
      toast({ title: "Tenant created" })
      setCreateOpen(false)
      setNewId("")
      setNewName("")
      setNewAgentSecret("")
      setSelectedId(id)
      await loadList({ silent: true })
      onTenantsChange?.()
    } catch (e) {
      toast({
        title: "Create failed",
        description: String(e),
        variant: "destructive",
      })
    }
  }

  const selectedSummary = tenants.find((t) => t.id === selectedId)

  const copySecretToast = async (text: string, okDescription: string) => {
    const ok = await copyTextToClipboard(text)
    if (ok) toast({ title: "Copied", description: okDescription })
    else
      toast({
        title: "Copy failed",
        description: "Your browser blocked clipboard access.",
        variant: "destructive",
      })
  }

  const generateAgentSecretAndCopy = (setter: (v: string) => void) => {
    const next = generateRandomAgentSecret()
    setter(next)
    void (async () => {
      const ok = await copyTextToClipboard(next)
      if (ok) {
        toast({
          title: "Generated and copied",
          description: "Paste into agent_config.yaml as agent_secret, then save or create the tenant.",
        })
      } else {
        toast({
          title: "Generated (copy failed)",
          description: "Use the Copy button — your browser blocked auto-copy.",
          variant: "destructive",
        })
      }
    })()
  }

  return (
    <section className="rounded-lg border border-border bg-card/50 p-4 sm:p-5">
      <div className="mb-5 max-w-2xl space-y-1">
        <h2 className="text-lg font-semibold text-foreground">Tenant directory</h2>
        <p className="text-sm text-muted-foreground">
          Each row is a customer workspace: the <span className="font-mono text-xs">tenant id</span> and{" "}
          <span className="font-mono text-xs">agent secret</span> must match what you put in{" "}
          <span className="font-mono text-xs">agent_config.yaml</span> on their VPS agents.
        </p>
      </div>

      {listLoading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading tenants…
        </div>
      ) : tenants.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="max-w-sm space-y-1">
            <p className="font-medium text-foreground">No tenants yet</p>
            <p className="text-sm text-muted-foreground">
              Create a tenant to get an id and agent secret. Then add client users tied to that tenant.
            </p>
          </div>
          <Button type="button" className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New tenant
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
          {/* Picker */}
          <div className="flex w-full flex-col gap-3 lg:w-[min(100%,20rem)] lg:shrink-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">
                Tenants
                <span className="ml-1.5 font-normal text-muted-foreground">({tenants.length})</span>
              </p>
              <Button type="button" size="sm" className="h-8 gap-1" onClick={() => setCreateOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                New
              </Button>
            </div>
            <div className="overflow-hidden rounded-lg border border-border bg-background/60">
              <ul className="max-h-[min(22rem,50vh)] divide-y divide-border overflow-y-auto">
                {tenants.map((t) => {
                  const active = t.id === selectedId
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(t.id)}
                        className={cn(
                          "flex w-full items-start border-l-[3px] py-3 pl-3 pr-3 text-left transition-colors",
                          active
                            ? "border-l-primary bg-accent/50"
                            : "border-l-transparent hover:bg-muted/60",
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-sm font-semibold tracking-tight">{t.id}</div>
                          {t.name?.trim() ? (
                            <div className="mt-0.5 truncate text-xs opacity-80">{t.name}</div>
                          ) : (
                            <div className="mt-0.5 text-xs opacity-60">No display name</div>
                          )}
                          <div className="mt-2">
                            <Badge
                              variant={t.agent_secret_configured ? "secondary" : "outline"}
                              className="text-[10px] font-normal"
                            >
                              {t.agent_secret_configured ? "Agent secret set" : "Secret missing"}
                            </Badge>
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>

          {/* Detail: form stays mounted; overlay while fetching so height matches content above (no jump for Agent software). */}
          <div className="min-w-0 flex-1">
            <div className="rounded-lg border border-border bg-background/60 p-4 sm:p-5">
              {!selectedId ? null : (
                <div className="relative">
                  {detailLoading ? (
                    <div
                      className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/90 backdrop-blur-[1px]"
                      aria-busy="true"
                      aria-label="Loading tenant"
                    >
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading tenant…
                      </div>
                    </div>
                  ) : null}
                  <div className={cn(detailLoading && "pointer-events-none select-none")}>
                    <div className="space-y-6">
                      <div>
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                          <TextCursorInput className="h-4 w-4 text-muted-foreground" />
                          Identity & label
                        </h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="tenant-id-ro">Tenant ID</Label>
                            <Input
                              id="tenant-id-ro"
                              value={selectedId}
                              readOnly
                              className="bg-muted/50 font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                              Stable identifier — use this in JWT / <span className="font-mono">tenant_id</span> in
                              agent config.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="tenant-name">Display name</Label>
                            <Input
                              id="tenant-name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="e.g. Acme Production"
                              disabled={detailLoading}
                            />
                            <p className="text-xs text-muted-foreground">Shown in admin lists only; optional.</p>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-border pt-6">
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                          <KeyRound className="h-4 w-4 text-muted-foreground" />
                          Agent authentication
                        </h3>
                        <div className="space-y-4">
                          <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
                            {secretConfigured ? (
                              <>
                                A secret is <strong className="text-foreground">configured</strong> on the server. It is
                                never shown again — enter a new value below only if you are rotating it.
                              </>
                            ) : (
                              <>
                                <strong className="text-foreground">No secret yet.</strong> Set one here so agents can
                                authenticate. Share it securely with whoever deploys{" "}
                                <span className="font-mono">agent_config.yaml</span>.
                              </>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <Label htmlFor="tenant-secret">New agent secret</Label>
                              <div className="flex flex-wrap justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="shrink-0"
                                  disabled={detailLoading || !newSecret.trim()}
                                  onClick={() =>
                                    void copySecretToast(
                                      newSecret,
                                      "Paste into each agent’s agent_config.yaml, then Save changes.",
                                    )
                                  }
                                >
                                  Copy
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="shrink-0"
                                  disabled={detailLoading}
                                  onClick={() => generateAgentSecretAndCopy(setNewSecret)}
                                >
                                  Generate random
                                </Button>
                              </div>
                            </div>
                            <Input
                              id="tenant-secret"
                              type="password"
                              autoComplete="new-password"
                              placeholder={
                                secretConfigured
                                  ? "Leave blank to keep current secret"
                                  : "Required before agents can connect"
                              }
                              value={newSecret}
                              onChange={(e) => setNewSecret(e.target.value)}
                              disabled={detailLoading}
                            />
                            <p className="text-xs text-muted-foreground">
                              Dots hide the value — use <strong className="font-medium text-foreground">Copy</strong> or{" "}
                              <strong className="font-medium text-foreground">Generate random</strong> (copies
                              automatically). After saving, update <span className="font-mono">agent_secret</span> on
                              every agent for this tenant.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
                        <Button type="button" disabled={saving || detailLoading} onClick={() => void onSave()}>
                          {saving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving…
                            </>
                          ) : (
                            "Save changes"
                          )}
                        </Button>
                        {selectedSummary ? (
                          <span className="text-xs text-muted-foreground">
                            Editing <span className="font-mono text-foreground">{selectedSummary.id}</span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New tenant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nt-id">Tenant id</Label>
              <Input
                id="nt-id"
                className="font-mono text-sm"
                placeholder="e.g. acme"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nt-name">Display name</Label>
              <Input
                id="nt-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="optional"
              />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="nt-sec">Agent secret</Label>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    disabled={!newAgentSecret.trim()}
                    onClick={() =>
                      void copySecretToast(
                        newAgentSecret,
                        "Paste into agent_config.yaml as agent_secret before clicking Create.",
                      )
                    }
                  >
                    Copy
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => generateAgentSecretAndCopy(setNewAgentSecret)}
                  >
                    Generate random
                  </Button>
                </div>
              </div>
              <Input
                id="nt-sec"
                type="password"
                autoComplete="new-password"
                value={newAgentSecret}
                onChange={(e) => setNewAgentSecret(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Generate random copies to the clipboard so you can paste into YAML even though the field stays masked.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void onCreateTenant()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
