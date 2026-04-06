"use client"

import { useEffect, useState } from "react"
import { Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { copyTextToClipboard } from "@/lib/copy-text"
import { generateRandomCmdSecret, getCmdSecret, setCmdSecret } from "@/lib/cmd-secret"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandSecretDialog({ open, onOpenChange }: Props) {
  const [value, setValue] = useState("")

  useEffect(() => {
    if (open) setValue(getCmdSecret())
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Command secret</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-4 text-left leading-relaxed">
              <p>
                This code is used to authorize remote commands between the agent and the panel.
              </p>
              <ul className="list-none space-y-2.5 text-sm">
                <li className="flex gap-2.5">
                  <span
                    className="mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground/75"
                    aria-hidden
                  />
                  <span>
                    It must match the value in{" "}
                    <span className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
                      secret.txt
                    </span>{" "}
                    or{" "}
                    <span className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
                      command_secret
                    </span>{" "}
                    in{" "}
                    <span className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
                      agent_config.yaml
                    </span>
                    .
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span
                    className="mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground/75"
                    aria-hidden
                  />
                  <span>It&apos;s stored only in your browser (not on the server).</span>
                </li>
                <li className="flex gap-2.5">
                  <span
                    className="mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground/75"
                    aria-hidden
                  />
                  <span>
                    You can copy it or generate a new one automatically.
                  </span>
                </li>
              </ul>
              <div className="flex gap-3 rounded-md border border-border bg-muted/50 p-3 text-sm text-foreground">
                <Check
                  className="mt-0.5 size-4 shrink-0 text-success"
                  aria-hidden
                />
                <span>
                  Make sure both sides use the same value for everything to work properly.
                </span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor="cmd-secret">Secret</Label>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                disabled={!value.trim()}
                onClick={() => {
                  void (async () => {
                    const ok = await copyTextToClipboard(value)
                    if (ok) {
                      toast({
                        title: "Copied",
                        description: "Paste into secret.txt or agent_config.yaml, then Save here.",
                      })
                    } else {
                      toast({
                        title: "Copy failed",
                        description: "Your browser blocked clipboard access.",
                        variant: "destructive",
                      })
                    }
                  })()
                }}
              >
                Copy
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  const next = generateRandomCmdSecret()
                  setValue(next)
                  void (async () => {
                    const ok = await copyTextToClipboard(next)
                    if (ok) {
                      toast({
                        title: "Generated and copied",
                        description: "Paste into the agent, then click Save to store in this browser.",
                      })
                    } else {
                      toast({
                        title: "Generated (copy failed)",
                        description: "Use the Copy button — your browser blocked auto-copy.",
                        variant: "destructive",
                      })
                    }
                  })()
                }}
              >
                Generate random
              </Button>
            </div>
          </div>
          <Input
            id="cmd-secret"
            type="password"
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Same value as on the agent"
          />
        </div>
        <DialogFooter className="gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              setCmdSecret(value)
              onOpenChange(false)
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
