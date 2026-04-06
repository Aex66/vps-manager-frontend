"use client"

import { useEffect } from "react"

/** Root URL sends the browser to the authenticated app shell. */
export default function HomePage() {
  useEffect(() => {
    window.location.replace("/dashboard")
  }, [])
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Loading…
    </div>
  )
}
