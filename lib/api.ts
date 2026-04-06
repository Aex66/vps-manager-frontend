const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

export function apiBase(): string {
  return raw.replace(/\/$/, "")
}

export function wsUiUrl(token: string): string {
  const b = apiBase()
  const u = new URL("/ws/ui", b.replace(/^ws/i, "http"))
  u.protocol = b.startsWith("https") ? "wss:" : "ws:"
  u.searchParams.set("token", token)
  return u.toString()
}

/** Agent WebSocket URL for `vps_manager_ws` in agent_config.yaml (no auth query; agent uses tenant + secret). */
export function wsAgentUrl(): string {
  const b = apiBase()
  const u = new URL("/ws/agent", b.replace(/^ws/i, "http"))
  u.protocol = b.startsWith("https") ? "wss:" : "ws:"
  return u.toString()
}

/** Sign-in via Next BFF: sets HttpOnly `vps_session` cookie (persists across browser restarts). */
export async function loginWithCookie(username: string, password: string): Promise<void> {
  const r = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ username, password }),
  })
  if (r.status === 403) {
    const j = (await r.json().catch(() => ({}))) as { error?: string }
    if (j.error === "use_admin_login") {
      throw new Error("use_admin_login")
    }
    throw new Error("Forbidden")
  }
  if (!r.ok) throw new Error("Invalid credentials")
}

/** Operator sign-in: sets HttpOnly `vps_admin_session` cookie. */
export async function loginAdminWithCookie(username: string, password: string): Promise<void> {
  const r = await fetch("/api/auth/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ username, password }),
  })
  if (r.status === 403) {
    const j = (await r.json().catch(() => ({}))) as { error?: string }
    if (j.error === "use_dashboard_login") {
      throw new Error("use_dashboard_login")
    }
    throw new Error("Forbidden")
  }
  if (!r.ok) throw new Error("Invalid credentials")
}

export type AdminSessionInfo = { token: string; role: string; username: string }

export async function fetchAdminSession(): Promise<AdminSessionInfo | null> {
  const r = await fetch("/api/auth/admin/session", { credentials: "same-origin" })
  if (!r.ok) return null
  const j = (await r.json()) as { token?: string; role?: string; username?: string }
  const token = j.token?.trim()
  if (!token) return null
  const role =
    typeof j.role === "string" && j.role.trim() ? j.role.trim().toLowerCase() : "user"
  const username =
    typeof j.username === "string" && j.username.trim()
      ? j.username.trim().toLowerCase()
      : ""
  return { token, role, username }
}

export async function logoutAdminSession(): Promise<void> {
  await fetch("/api/auth/admin/logout", { method: "POST", credentials: "same-origin" })
}

export type SessionInfo = { token: string; role: string; username: string; tenantId: string }

/** Read JWT, role, username (sub), and tenant_id from the session cookie (server verifies JWT). */
export async function fetchSession(): Promise<SessionInfo | null> {
  const r = await fetch("/api/auth/session", { credentials: "same-origin" })
  if (!r.ok) return null
  const j = (await r.json()) as {
    token?: string
    role?: string
    username?: string
    tenant_id?: string
  }
  const token = j.token?.trim()
  if (!token) return null
  const role =
    typeof j.role === "string" && j.role.trim()
      ? j.role.trim().toLowerCase()
      : "user"
  const username =
    typeof j.username === "string" && j.username.trim()
      ? j.username.trim().toLowerCase()
      : ""
  const tenantId =
    typeof j.tenant_id === "string" && j.tenant_id.trim() ? j.tenant_id.trim() : "default"
  return { token, role, username, tenantId }
}

/** Read JWT from the session cookie (server only exposes it via this same-origin route). */
export async function fetchSessionToken(): Promise<string | null> {
  const s = await fetchSession()
  return s?.token ?? null
}

export async function logoutSession(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" })
}

export async function uploadAgentBundle(token: string, version: string, file: File): Promise<void> {
  const fd = new FormData()
  fd.append("version", version.trim())
  fd.append("file", file)
  const r = await fetch(`${apiBase()}/api/admin/agent-bundle`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  })
  if (!r.ok) {
    const t = await r.text()
    throw new Error(t !== "" ? t : r.statusText)
  }
}

export async function downloadAgentBundleBlob(token: string): Promise<Blob> {
  const r = await fetch(`${apiBase()}/api/admin/agent-bundle`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!r.ok) {
    const t = await r.text()
    throw new Error(t !== "" ? t : r.statusText)
  }
  return r.blob()
}

export type AdminUser = {
  id: number
  username: string
  role: string
  tenant_id: string
  created_at: string
}

export type AdminTenant = {
  id: string
  name: string
  agent_secret_configured: boolean
}

export async function listAdminTenants(token: string): Promise<AdminTenant[]> {
  const r = await fetch(`${apiBase()}/api/admin/tenants`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!r.ok) {
    const t = await r.text()
    throw new Error(t !== "" ? t : r.statusText)
  }
  return (await r.json()) as AdminTenant[]
}

export async function createAdminTenant(
  token: string,
  body: { id: string; name: string; agent_secret: string },
): Promise<AdminTenant> {
  const r = await fetch(`${apiBase()}/api/admin/tenants`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  if (!r.ok) {
    const t = await r.text()
    throw new Error(t !== "" ? t : r.statusText)
  }
  return (await r.json()) as AdminTenant
}

export async function getAdminTenant(token: string, tenantId: string): Promise<AdminTenant> {
  const q = new URLSearchParams({ tenant_id: tenantId.trim() })
  const r = await fetch(`${apiBase()}/api/admin/tenant?${q}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!r.ok) {
    const t = await r.text()
    throw new Error(t !== "" ? t : r.statusText)
  }
  return (await r.json()) as AdminTenant
}

export async function patchAdminTenant(
  token: string,
  tenantId: string,
  body: { name: string; agent_secret?: string },
): Promise<AdminTenant> {
  const q = new URLSearchParams({ tenant_id: tenantId.trim() })
  const r = await fetch(`${apiBase()}/api/admin/tenant?${q}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  if (!r.ok) {
    const t = await r.text()
    throw new Error(t !== "" ? t : r.statusText)
  }
  return (await r.json()) as AdminTenant
}

export async function listAdminUsers(token: string, tenantIdFilter?: string): Promise<AdminUser[]> {
  const url = new URL(`${apiBase()}/api/admin/users`)
  if (tenantIdFilter?.trim()) url.searchParams.set("tenant_id", tenantIdFilter.trim())
  const r = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!r.ok) {
    const t = await r.text()
    throw new Error(t !== "" ? t : r.statusText)
  }
  return (await r.json()) as AdminUser[]
}

export async function createAdminUser(
  token: string,
  body: { username: string; password: string; tenant_id: string; role?: string },
): Promise<AdminUser> {
  const r = await fetch(`${apiBase()}/api/admin/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...body, role: body.role ?? "user" }),
  })
  if (!r.ok) {
    const t = await r.text()
    throw new Error(t !== "" ? t : r.statusText)
  }
  return (await r.json()) as AdminUser
}

export async function updateAdminUser(
  token: string,
  id: number,
  body: { username?: string; password?: string; role?: string; tenant_id?: string },
): Promise<AdminUser> {
  const r = await fetch(`${apiBase()}/api/admin/users/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  if (!r.ok) {
    const t = await r.text()
    throw new Error(t !== "" ? t : r.statusText)
  }
  return (await r.json()) as AdminUser
}

export async function deleteAdminUser(token: string, id: number): Promise<void> {
  const r = await fetch(`${apiBase()}/api/admin/users/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!r.ok) {
    const t = await r.text()
    throw new Error(t !== "" ? t : r.statusText)
  }
}
