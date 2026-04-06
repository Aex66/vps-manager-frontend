import { NextResponse } from "next/server"
import { VPS_SESSION_COOKIE } from "@/lib/auth-cookie"

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(VPS_SESSION_COOKIE, "", {
    path: "/",
    maxAge: 0,
  })
  return res
}
