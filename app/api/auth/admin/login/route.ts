import { NextResponse } from "next/server"
import { backendBaseUrl } from "@/lib/server/backend-url"
import { SESSION_MAX_AGE_SEC, VPS_ADMIN_SESSION_COOKIE } from "@/lib/auth-cookie"

export async function POST(req: Request) {
  let body: { username?: string; password?: string }
  try {
    body = (await req.json()) as { username?: string; password?: string }
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 })
  }

  const username = typeof body.username === "string" ? body.username : ""
  const password = typeof body.password === "string" ? body.password : ""

  const r = await fetch(`${backendBaseUrl()}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })

  if (r.status === 403) {
    let err = "use_dashboard_login"
    try {
      const j = (await r.json()) as { error?: string }
      if (typeof j.error === "string" && j.error) err = j.error
    } catch {
      /* ignore */
    }
    return NextResponse.json({ error: err }, { status: 403 })
  }
  if (!r.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const j = (await r.json()) as { token?: string }
  const token = j.token?.trim()
  if (!token) {
    return NextResponse.json({ error: "no token" }, { status: 502 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(VPS_ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  })
  return res
}
