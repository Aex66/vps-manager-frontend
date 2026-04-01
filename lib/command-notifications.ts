import { COMMANDS } from "@/lib/types"

const COMMAND_LABEL = Object.fromEntries(COMMANDS.map((c) => [c.id, c.label])) as Record<
  string,
  string
>

export function describeCommand(cmd: string): string {
  return COMMAND_LABEL[cmd] ?? cmd
}

/** User-facing copy for fleet-wide sends. */
export function describeBulkCommand(cmd: string): string {
  switch (cmd) {
    case "refresh_all":
      return "Started all VPS (refresh / start stack)"
    case "stop_vps":
      return "Stopped all VPS"
    default:
      return describeCommand(cmd)
  }
}
