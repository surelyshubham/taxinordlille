"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { adminLabels } from "@/lib/admin/labels";

import { updateContactStatus } from "@/app/[lang]/(site)/contact/actions";

const STATUSES = ["nouveau", "traite", "cloture"] as const;

const LABELS: Record<(typeof STATUSES)[number], string> = {
  nouveau: "Nouveau",
  traite: "Traité",
  cloture: "Clôturé",
};

/** Processing status control for one contact message. */
export function ContactMessageStatus({
  messageId,
  initialStatus,
}: {
  messageId: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = React.useState(initialStatus);
  const [pending, setPending] = React.useState(false);

  async function change(next: string) {
    const previous = status;
    setStatus(next);
    setPending(true);

    const result = await updateContactStatus(messageId, next as never);
    setPending(false);

    if (!result.ok) {
      setStatus(previous);
      return;
    }
    router.refresh();
  }

  return (
    <span className="inline-flex items-center gap-2">
      <select
        value={status}
        disabled={pending}
        onChange={(event) => void change(event.target.value)}
        aria-label={adminLabels.messages.status}
        className="h-9 rounded-lg border border-line-strong bg-surface-2 px-3 text-xs text-content focus:border-gold-400 focus:outline-none"
      >
        {STATUSES.map((value) => (
          <option key={value} value={value}>
            {LABELS[value]}
          </option>
        ))}
      </select>
      {pending ? (
        <Loader2 aria-hidden="true" className="size-3.5 animate-spin text-gold-400" />
      ) : null}
    </span>
  );
}