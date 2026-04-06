import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { VPS_ADMIN_SESSION_COOKIE, VPS_SESSION_COOKIE } from "@/lib/auth-cookie"

const DASHBOARD_LOGIN = "/dashboard/login"
const ADMIN_LOGIN = "/admin/login"

type SessionState =
  | { ok: false }
  | { ok: true; role: string }

async function readSession(
  req: NextRequest,
  cookieName: string,
): Promise<SessionState> {
  const secretRaw = process.env.JWT_SECRET?.trim()
  const token = req.cookies.get(cookieName)?.value
  if (!token || !secretRaw) return { ok: false }
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secretRaw), {
      algorithms: ["HS256"],
    })
    const role =
      typeof payload.role === "string" && payload.role.trim()
        ? payload.role.trim().toLowerCase()
        : "user"
    return { ok: true, role }
  } catch {
    return { ok: false }
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const dash = await readSession(req, VPS_SESSION_COOKIE)
  const adm = await readSession(req, VPS_ADMIN_SESSION_COOKIE)
  const isDashboardLogin = pathname === DASHBOARD_LOGIN
  const isAdminLogin = pathname === ADMIN_LOGIN

  if (isDashboardLogin) {
    if (dash.ok && dash.role === "user") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    if (adm.ok && adm.role === "admin") {
      return NextResponse.redirect(new URL("/admin/tenants", req.url))
    }
    return NextResponse.next()
  }

  if (isAdminLogin) {
    if (adm.ok && adm.role === "admin") {
      return NextResponse.redirect(new URL("/admin/tenants", req.url))
    }
    return NextResponse.next()
  }

  if (!isDashboardLogin && (pathname === "/dashboard" || pathname.startsWith("/dashboard/"))) {
    if (!dash.ok || dash.role !== "user") {
      return NextResponse.redirect(new URL(DASHBOARD_LOGIN, req.url))
    }
  }

  if (!isAdminLogin && (pathname === "/admin" || pathname.startsWith("/admin/"))) {
    if (!adm.ok || adm.role !== "admin") {
      return NextResponse.redirect(new URL(ADMIN_LOGIN, req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/admin", "/admin/:path*"],
}
