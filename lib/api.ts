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

export async function login(username: string, password: string): Promise<string> {
  const r = await fetch(`${apiBase()}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
  if (!r.ok) throw new Error("Invalid credentials")
  const j = (await r.json()) as { token: string }
  return j.token
}
