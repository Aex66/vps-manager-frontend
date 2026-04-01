"use client"

import { Server, Cpu } from "lucide-react"

interface StatCardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
}

function StatCard({ title, value, subtitle, icon }: StatCardProps) {
  return (
    <div className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-5 transition-colors hover:border-muted-foreground/30">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{title}</span>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight text-foreground">{value}</span>
      </div>
      <span className="text-xs text-muted-foreground">{subtitle}</span>
    </div>
  )
}

type StatsCardsProps = {
  totalServers: number
  runningServers: number
  avgCpu: number
}

export function StatsCards({ totalServers, runningServers, avgCpu }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="VPS"
        value={`${runningServers}/${totalServers}`}
        subtitle="Running / total agents"
        icon={<Server className="h-5 w-5" />}
      />
      <StatCard
        title="CPU Usage"
        value={`${avgCpu}%`}
        subtitle="Average across reporting VPS"
        icon={<Cpu className="h-5 w-5" />}
      />
    </div>
  )
}
