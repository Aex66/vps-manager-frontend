"use client"

import { createContext, useContext, type ReactNode } from "react"

export type AdminSessionContextValue = {
  token: string
  currentUsername: string
  tenantsVersion: number
  bumpTenantsVersion: () => void
  broadcastAgentUpdate: () => void
}

const AdminSessionContext = createContext<AdminSessionContextValue | null>(null)

export function AdminSessionProvider({
  value,
  children,
}: {
  value: AdminSessionContextValue
  children: ReactNode
}) {
  return (
    <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>
  )
}

export function useAdminSession(): AdminSessionContextValue {
  const v = useContext(AdminSessionContext)
  if (!v) {
    throw new Error("useAdminSession must be used within AdminSessionProvider")
  }
  return v
}
