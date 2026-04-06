"use client"

import { useEffect } from "react"

/** Legacy `/login` → `/dashboard/login` (token and API unchanged). */
export default function LegacyLoginRedirectPage() {
  useEffect(() => {
    window.location.replace("/dashboard/login")
  }, [])
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Redirecting…
    </div>
  )
}
