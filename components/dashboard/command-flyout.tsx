"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { COMMANDS, vpsDisplayName, type VPSRow } from "@/lib/types"

type Props = {
  vps: VPSRow | null
  anchor: { x: number; y: number } | null
  onClose: () => void
  onCommand: (cmd: string) => void
  /** Disables every command except Screenshot (use with `screenshotCooldown` for capture throttle). */
  commandsDisabled?: boolean
  /** Disables only the Screenshot row (independent per-VPS cooldown). */
  screenshotCooldown?: boolean
}

function computePanelPosition(anchor: { x: number; y: number }) {
  const margin = 10
  const vh = window.innerHeight
  const vw = window.innerWidth
  const width = Math.min(288, vw - 2 * margin)
  const left = Math.max(margin, Math.min(anchor.x, vw - width - margin))
  let top = anchor.y + 6
  let maxHeight = Math.min(560, vh - top - margin)
  const minScrollArea = 220
  if (maxHeight < minScrollArea) {
    maxHeight = Math.min(560, vh - 2 * margin)
    top = vh - margin - maxHeight
  }
  top = Math.max(margin, top)
  maxHeight = Math.max(160, Math.min(maxHeight, vh - top - margin))
  return { top, left, width, maxHeight }
}

export function CommandFlyout({
  vps,
  anchor,
  onClose,
  onCommand,
  commandsDisabled = false,
  screenshotCooldown = false,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const layout = useMemo(() => {
    if (!anchor) return null
    return computePanelPosition(anchor)
  }, [anchor])

  useEffect(() => {
    if (!vps || !anchor) return
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current?.contains(e.target as Node)) return
      onClose()
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [vps, anchor, onClose])

  if (!mounted || !vps || !anchor || !layout) return null

  const menu = (
    <div
      ref={panelRef}
      role="menu"
      aria-label="Agent commands"
      className="fixed z-[200] overflow-y-auto overflow-x-hidden rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-lg [scrollbar-gutter:stable]"
      style={{
        top: layout.top,
        left: layout.left,
        width: layout.width,
        maxHeight: layout.maxHeight,
      }}
    >
      <p
        className="sticky top-0 z-10 border-b border-border bg-popover px-3 py-2 text-[11px] text-muted-foreground"
        title={vpsDisplayName(vps)}
      >
        {vpsDisplayName(vps)}
      </p>
      <div className="py-1">
        {COMMANDS.map((c) => {
          const itemDisabled =
            c.id === "screenshot" ? screenshotCooldown : commandsDisabled
          return (
            <button
              key={c.id}
              type="button"
              role="menuitem"
              disabled={itemDisabled}
              className="w-full cursor-pointer px-3 py-2.5 text-left text-sm leading-snug whitespace-normal break-words hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
              onClick={() => {
                if (itemDisabled) return
                onCommand(c.id)
                onClose()
              }}
            >
              {c.label}
            </button>
          )
        })}
      </div>
    </div>
  )

  return createPortal(menu, document.body)
}
