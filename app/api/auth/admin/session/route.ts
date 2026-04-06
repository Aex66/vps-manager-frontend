import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { VPS_ADMIN_SESSION_COOKIE } from "@/lib/auth-cookie"

/** Operator session: JWT from `vps_admin_session` (no client tenant on token). */
export async function GET() {
  const jar = await cookies()
  const token = jar.get(VPS_ADMIN_SESSION_COOKIE)?.value?.trim()
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const secret = process.env.JWT_SECRET?.trim()
  if (!secret) {
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 })
  }
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    })
    const role =
      typeof payload.role === "string" && payload.role.trim()
        ? payload.role.trim().toLowerCase()
        : "user"
    if (role !== "admin") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
    const username =
      typeof payload.sub === "string" && payload.sub.trim()
        ? payload.sub.trim().toLowerCase()
        : ""
    return NextResponse.json({ token, role, username })
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
}
