import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Two-letter avatar initials from login username or email local-part. */
export function userAvatarInitials(source: string | null | undefined): string {
  const raw = source?.trim()
  if (!raw) return "?"

  const local = raw.includes("@") ? (raw.split("@")[0]?.trim() ?? raw) : raw
  const parts = local.split(/[._\s-]+/).filter(Boolean)

  if (parts.length >= 2) {
    const a = parts[0]?.charAt(0)
    const b = parts[1]?.charAt(0)
    if (a && b) return (a + b).toUpperCase()
  }

  const single = (parts[0] ?? local).replace(/[^a-zA-Z0-9]/g, "")
  if (single.length >= 2) return single.slice(0, 2).toUpperCase()
  if (single.length === 1) return single.toUpperCase()

  const fallback = local.replace(/\s/g, "")
  if (fallback.length >= 2) return fallback.slice(0, 2).toUpperCase()
  if (fallback.length === 1) return fallback.toUpperCase()
  return "?"
}
