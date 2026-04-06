/** Browser-only storage for cmd_secret (must match agent secret.txt). Not sent to backend for persistence. */
export const VPS_CMD_SECRET_KEY = "vps_cmd_secret"

export const VPS_CMD_SECRET_CHANGED_EVENT = "vps-cmd-secret-changed"

export function getCmdSecret(): string {
  if (typeof window === "undefined") return ""
  try {
    return (localStorage.getItem(VPS_CMD_SECRET_KEY) ?? "").trim()
  } catch {
    return ""
  }
}

/** 32-byte random secret (hex). Use for command_secret / secret.txt; paste the same value in the agent config. */
export function generateRandomCmdSecret(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}

export function setCmdSecret(value: string): void {
  try {
    localStorage.setItem(VPS_CMD_SECRET_KEY, value.trim())
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(VPS_CMD_SECRET_CHANGED_EVENT))
    }
  } catch {
    /* ignore quota / private mode */
  }
}
