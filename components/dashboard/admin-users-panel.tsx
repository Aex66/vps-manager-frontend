"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Pencil, Plus, Trash2, Users } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import {
  type AdminTenant,
  type AdminUser,
  createAdminUser,
  deleteAdminUser,
  listAdminTenants,
  listAdminUsers,
  updateAdminUser,
} from "@/lib/api"

type AdminUsersPanelProps = {
  authToken: string
  currentUsername: string
  tenantsVersion?: number
}

export function AdminUsersPanel({
  authToken,
  currentUsername,
  tenantsVersion = 0,
}: AdminUsersPanelProps) {
  const [rows, setRows] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null)

  const [tenantChoices, setTenantChoices] = useState<AdminTenant[]>([])
  const [createUsername, setCreateUsername] = useState("")
  const [createPassword, setCreatePassword] = useState("")
  const [createTenantId, setCreateTenantId] = useState("")

  const [editUsername, setEditUsername] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [editTenantId, setEditTenantId] = useState("")
  const [editSaving, setEditSaving] = useState(false)

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true
    if (!silent) setLoading(true)
    try {
      const list = await listAdminUsers(authToken)
      setRows(list)
    } catch (e) {
      toast({
        title: "Could not load users",
        description: String(e),
        variant: "destructive",
      })
    } finally {
      if (!silent) setLoading(false)
    }
  }, [authToken])

  useEffect(() => {
    void load()
  }, [load, tenantsVersion])

  const loadTenantsForForm = useCallback(async () => {
    try {
      const list = await listAdminTenants(authToken)
      setTenantChoices(list)
      setCreateTenantId((prev) => {
        if (prev && list.some((t) => t.id === prev)) return prev
        return list[0]?.id ?? ""
      })
    } catch (e) {
      toast({
        title: "Could not load tenants",
        description: String(e),
        variant: "destructive",
      })
    }
  }, [authToken])

  useEffect(() => {
    if (createOpen) void loadTenantsForForm()
  }, [createOpen, loadTenantsForForm])

  const counts = useMemo(() => {
    let operators = 0
    let clients = 0
    for (const u of rows) {
      if (u.role === "admin") operators += 1
      else clients += 1
    }
    return { operators, clients, total: rows.length }
  }, [rows])

  const openEdit = (u: AdminUser) => {
    setEditSaving(false)
    setEditUser(u)
    setEditUsername(u.username)
    setEditPassword("")
    setEditTenantId(u.tenant_id)
  }

  const onCreate = async () => {
    if (!createTenantId.trim()) {
      toast({ title: "Choose a tenant", variant: "destructive" })
      return
    }
    try {
      await createAdminUser(authToken, {
        username: createUsername.trim(),
        password: createPassword,
        tenant_id: createTenantId.trim(),
      })
      toast({ title: "User created" })
      setCreateOpen(false)
      setCreateUsername("")
      setCreatePassword("")
      await load({ silent: true })
    } catch (e) {
      toast({
        title: "Create failed",
        description: String(e),
        variant: "destructive",
      })
    }
  }

  const onSaveEdit = async () => {
    if (!editUser || editSaving) return
    setEditSaving(true)
    try {
      if (editUser.role === "admin") {
        const body: { username?: string; password?: string } = {
          username: editUsername.trim(),
        }
        if (editPassword.trim()) body.password = editPassword
        await updateAdminUser(authToken, editUser.id, body)
      } else {
        const body: { username?: string; password?: string; role?: string; tenant_id?: string } = {
          username: editUsername.trim(),
          role: "user",
          tenant_id: editTenantId.trim(),
        }
        if (editPassword.trim()) body.password = editPassword
        await updateAdminUser(authToken, editUser.id, body)
      }
      toast({ title: "User updated" })
      setEditUser(null)
      await load({ silent: true })
    } catch (e) {
      toast({
        title: "Update failed",
        description: String(e),
        variant: "destructive",
      })
    } finally {
      setEditSaving(false)
    }
  }

  const onConfirmDelete = async () => {
    if (!deleteUser) return
    try {
      await deleteAdminUser(authToken, deleteUser.id)
      toast({ title: "User deleted" })
      setDeleteUser(null)
      await load({ silent: true })
    } catch (e) {
      toast({
        title: "Delete failed",
        description: String(e),
        variant: "destructive",
      })
    }
  }

  const editingIsOperator = editUser?.role === "admin"

  return (
    <section className="rounded-lg border border-border bg-card/50 p-4 sm:p-5">
      <div className="mb-5 max-w-2xl space-y-1">
        <h2 className="text-lg font-semibold text-foreground">User accounts</h2>
        <p className="text-sm text-muted-foreground">
          Operators sign in at <span className="font-mono text-xs">/admin</span>; client users at{" "}
          <span className="font-mono text-xs">/dashboard</span>. Each client belongs to one tenant.
        </p>
      </div>

      {/* Same max width as the table so the action button sits above the table, not at the viewport edge */}
      <div className="max-w-4xl space-y-4">
        <div
          className={
            !loading && rows.length > 0
              ? "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              : "flex flex-wrap items-center justify-end gap-3"
          }
        >
          {!loading && rows.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{counts.total}</span> total ·{" "}
              <span className="text-foreground">{counts.operators}</span> operator
              {counts.operators !== 1 ? "s" : ""} ·{" "}
              <span className="text-foreground">{counts.clients}</span> client
              {counts.clients !== 1 ? "s" : ""}
            </p>
          ) : null}
          <Button type="button" size="sm" className="shrink-0 gap-1" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Add client user
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading users…
          </div>
        ) : rows.length === 0 ? (
          <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">No accounts yet</p>
              <p className="text-sm text-muted-foreground">
                Add a client user and assign a tenant. Create tenants first under Tenants &amp; agents.
              </p>
            </div>
            <Button type="button" className="gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Add client user
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-background/60">
            <Table className="table-fixed text-sm">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[34%] px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Username
                </TableHead>
                <TableHead className="hidden w-[26%] px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:table-cell">
                  Tenant
                </TableHead>
                <TableHead className="w-[22%] px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:w-[18%]">
                  Role
                </TableHead>
                <TableHead className="hidden w-[30%] px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:table-cell">
                  Created
                </TableHead>
                <TableHead className="w-[96px] px-2 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span className="sr-only sm:not-sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => {
                const isSelf = u.username.toLowerCase() === currentUsername.toLowerCase()
                return (
                  <TableRow key={u.id}>
                    <TableCell className="px-3 py-2.5 align-middle">
                      <div className="flex min-w-0 items-baseline gap-1.5">
                        <span className="truncate font-medium" title={u.username}>
                          {u.username}
                        </span>
                        {isSelf ? (
                          <span className="shrink-0 text-xs font-normal text-muted-foreground">(you)</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="hidden px-3 py-2.5 align-middle md:table-cell">
                      <span
                        className="block truncate font-mono text-xs text-foreground"
                        title={u.role === "admin" ? undefined : u.tenant_id}
                      >
                        {u.role === "admin" ? "—" : u.tenant_id}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 align-middle">
                      <Badge
                        variant={u.role === "admin" ? "default" : "secondary"}
                        className="font-normal tabular-nums"
                      >
                        {u.role === "admin" ? "operator" : "user"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden px-3 py-2.5 align-middle text-xs tabular-nums text-muted-foreground lg:table-cell">
                      <time dateTime={u.created_at} title={new Date(u.created_at).toISOString()}>
                        {new Date(u.created_at).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </time>
                    </TableCell>
                    <TableCell className="px-2 py-2.5 text-right align-middle">
                      <div className="flex justify-end gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Edit"
                          onClick={() => openEdit(u)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Delete"
                          disabled={isSelf}
                          onClick={() => setDeleteUser(u)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add client user</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tenant</Label>
              <Select value={createTenantId} onValueChange={setCreateTenantId}>
                <SelectTrigger className="w-full font-mono">
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenantChoices.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="font-mono">
                      {t.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-name">Username</Label>
              <Input
                id="new-user-name"
                autoComplete="off"
                value={createUsername}
                onChange={(e) => setCreateUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-pass">Password</Label>
              <Input
                id="new-user-pass"
                type="password"
                autoComplete="new-password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void onCreate()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editUser !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditUser(null)
            setEditSaving(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingIsOperator ? "Edit operator" : "Edit client user"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editingIsOperator ? (
              <div className="space-y-2">
                <Label htmlFor="edit-user-tenant">Tenant ID</Label>
                <Input
                  id="edit-user-tenant"
                  className="font-mono text-sm"
                  value={editTenantId}
                  onChange={(e) => setEditTenantId(e.target.value)}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                The operator account is not tied to a client tenant.
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-user-name">Username</Label>
              <Input
                id="edit-user-name"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-user-pass">New password (optional)</Label>
              <Input
                id="edit-user-pass"
                type="password"
                autoComplete="new-password"
                placeholder="Leave blank to keep current"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={editSaving} onClick={() => setEditUser(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={editSaving} onClick={() => void onSaveEdit()}>
              {editSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteUser !== null} onOpenChange={(o) => !o && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes <strong>{deleteUser?.username}</strong>. They will no longer be able to sign in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void onConfirmDelete()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
