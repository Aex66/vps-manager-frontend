"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { KeyRound, Monitor, Moon, Search, Settings, Sun, ChevronDown } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CommandSecretDialog } from "@/components/dashboard/command-secret-dialog"
import { userAvatarInitials } from "@/lib/utils"

type HeaderProps = {
  searchValue: string
  onSearchChange: (value: string) => void
  onLogout: () => void
  /** Session username (or email); drives the avatar initials. */
  accountUsername?: string | null
  /** When false, hides the server search field (e.g. legal pages). Default true. */
  showSearch?: boolean
  /** When false, hides the Terms link (e.g. on /tos). Default true. */
  showTermsLink?: boolean
  /** Link to /admin (dashboard toolbar). */
  showAdminLink?: boolean
  /** Link back to dashboard (admin page). */
  showBackToDashboard?: boolean
}

export function Header({
  searchValue,
  onSearchChange,
  onLogout,
  showSearch = true,
  showTermsLink = true,
  showAdminLink = false,
  showBackToDashboard = false,
  accountUsername = null,
}: HeaderProps) {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [cmdSecretOpen, setCmdSecretOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const avatarInitials = userAvatarInitials(accountUsername)

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
      <div className="flex items-center gap-6">
        <Link
          href="/dashboard"
          className="flex items-center overflow-visible rounded-md outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="VPSync — dashboard"
        >
          <span className="inline-flex items-center gap-1.2 font-sans text-xl font-bold italic tracking-normal">
            <span className="inline-block bg-gradient-to-tr from-blue-600 via-sky-500 to-cyan-400 bg-clip-text px-px text-transparent [-webkit-background-clip:text]">
              VP
            </span>
            <span className="text-foreground">Sync</span>
          </span>
        </Link>
      </div>
      <div className="flex items-center gap-3">
        {showSearch ? (
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search servers..."
              className="w-64 bg-secondary pl-9 text-sm placeholder:text-muted-foreground"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        ) : null}
        {showBackToDashboard ? (
          <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
            <Link href="/dashboard">← Dashboard</Link>
          </Button>
        ) : null}
        {showAdminLink ? (
          <Button variant="outline" size="sm" className="border-border" asChild>
            <Link href="/admin/tenants">Admin</Link>
          </Button>
        ) : null}
        {showTermsLink ? (
          <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
            <Link href="/tos">Terms</Link>
          </Button>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
              Appearance
            </DropdownMenuLabel>
            <DropdownMenuItem
              className="gap-2"
              disabled={!mounted}
              onClick={() => setTheme("light")}
            >
              <Sun className="h-4 w-4" />
              Light
              {mounted && theme === "light" ? <span className="ml-auto text-xs opacity-60">✓</span> : null}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2"
              disabled={!mounted}
              onClick={() => setTheme("dark")}
            >
              <Moon className="h-4 w-4" />
              Dark
              {mounted && theme === "dark" ? <span className="ml-auto text-xs opacity-60">✓</span> : null}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2"
              disabled={!mounted}
              onClick={() => setTheme("system")}
            >
              <Monitor className="h-4 w-4" />
              System
              {mounted && theme === "system" ? <span className="ml-auto text-xs opacity-60">✓</span> : null}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
              Security
            </DropdownMenuLabel>
            <DropdownMenuItem
              className="gap-2"
              onSelect={() => {
                setTimeout(() => setCmdSecretOpen(true), 0)
              }}
            >
              <KeyRound className="h-4 w-4" />
              Command secret…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <CommandSecretDialog open={cmdSecretOpen} onOpenChange={setCmdSecretOpen} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              title={accountUsername?.trim() ? accountUsername : "Account"}
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground"
                aria-hidden
              >
                {avatarInitials}
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {accountUsername?.trim() ? (
              <>
                <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                  {accountUsername}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            ) : null}
            <DropdownMenuItem onClick={onLogout}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
