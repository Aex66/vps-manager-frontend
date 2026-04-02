"use client"

import { useEffect, useState } from "react"
import { Monitor, Moon, Search, Settings, Sun, ChevronDown } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type HeaderProps = {
  searchValue: string
  onSearchChange: (value: string) => void
  onLogout: () => void
}

export function Header({ searchValue, onSearchChange, onLogout }: HeaderProps) {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent">
            <span className="text-sm font-bold text-accent-foreground">J</span>
          </div>
          <span className="text-lg font-semibold text-foreground">Joseck</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search servers..."
            className="w-64 bg-secondary pl-9 text-sm placeholder:text-muted-foreground"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
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
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
                JD
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onLogout}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
