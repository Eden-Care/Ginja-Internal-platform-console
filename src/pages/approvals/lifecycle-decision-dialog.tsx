import * as React from "react"
import { CheckIcon, Loader2Icon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Note } from "@/components/console/note"
import { MiniBadge } from "@/components/console/tagpill"
import {
  useDecideLifecycleRequest,
  useLifecycleRequests,
} from "@/features/payers/use-payer-record"
import type { ApprovalQueueItem } from "@/features/approvals/types"

const ACTION_LABEL: Record<string, string> = {
  SUSPEND: "Suspend",
  REACTIVATE: "Reactivate",
  RETIRE: "Retire",
}

/** Checker decision on a maker-checker lifecycle change request. Approve executes
   the transition (suspend / reactivate / retire); reject leaves the payer
   unchanged. The request's reason/note are loaded from the payer's
   lifecycle-request history (the queue row carries only the id + action). */
export function LifecycleDecisionDialog({
  item,
  onClose,
}: {
  item: ApprovalQueueItem | null
  onClose: () => void
}) {
  const open = item != null
  const payerId = item?.id ?? null
  const lcrId = item?.lifecycleRequestId ?? null

  const { data: requests } = useLifecycleRequests(open ? payerId : null)
  const req = requests?.find((r) => r.id === lcrId) ?? null
  const decideMut = useDecideLifecycleRequest()

  // Reset between requests is handled by remounting (the parent keys this dialog
  // on the request id), so local comment state starts fresh each time.
  const [comment, setComment] = React.useState("")

  if (!item || !payerId || !lcrId) return null

  const actionLabel = ACTION_LABEL[item.action ?? ""] ?? item.type
  const busy = decideMut.isPending

  const decide = (decision: "approve" | "reject") => {
    decideMut.mutate(
      { payerId, requestId: lcrId, decision, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(
            decision === "approve"
              ? `${actionLabel} approved — change applied.`
              : "Request rejected. Maker notified."
          )
          onClose()
        },
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Decision failed."),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {actionLabel} · {item.tenant}
          </DialogTitle>
          <DialogDescription>
            Review this lifecycle change request. Approving executes it
            immediately; rejecting leaves the account unchanged.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2.5 rounded-lg border p-3.5 text-[13px]">
          <div className="flex items-center gap-2">
            <MiniBadge tone="warning">{actionLabel}</MiniBadge>
            <span className="mono text-[11.5px] text-muted-foreground">
              {lcrId}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <div>
              <div className="text-[11.5px] text-muted-foreground">
                Requested by
              </div>
              <div>{req?.requestedBy ?? item.submittedBy ?? "—"}</div>
            </div>
            {req?.reason && (
              <div>
                <div className="text-[11.5px] text-muted-foreground">Reason</div>
                <div className="mono">{req.reason}</div>
              </div>
            )}
          </div>
          {req?.note && (
            <div>
              <div className="text-[11.5px] text-muted-foreground">Note</div>
              <div>{req.note}</div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>
            Decision comment{" "}
            <span className="text-[11px] text-muted-foreground">
              (required to reject)
            </span>
          </Label>
          <Textarea
            placeholder="Add a note for the maker…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        <Note tone="info" className="text-[11.5px]">
          Separation of duties is enforced — you can&rsquo;t decide a request you
          raised yourself.
        </Note>

        <DialogFooter>
          <Button
            variant="destructive"
            disabled={busy || !comment.trim()}
            title={!comment.trim() ? "A comment is required to reject" : undefined}
            onClick={() => decide("reject")}
          >
            <XIcon data-icon="inline-start" />
            Reject
          </Button>
          <Button disabled={busy} onClick={() => decide("approve")}>
            {busy ? (
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
            ) : (
              <CheckIcon data-icon="inline-start" />
            )}
            Approve &amp; apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
