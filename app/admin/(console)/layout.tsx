import type { ReactNode } from "react"
import { AdminLayoutShell } from "@/components/dashboard/admin-layout-shell"

export default function AdminConsoleLayout({ children }: { children: ReactNode }) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>
}
