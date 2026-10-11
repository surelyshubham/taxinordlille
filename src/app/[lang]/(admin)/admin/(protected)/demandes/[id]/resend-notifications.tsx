"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { adminLabels } from "@/lib/admin/labels";

import { resendEnquiryNotifications } from "../actions";

export function ResendNotifications({ enquiryId }: { enquiryId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [result, setResult] = React.useState<{ ok: boolean; message: string } | null>(
    null,
  );

  async function onClick() {
    setPending(true);
    setResult(null);
    try {
      setResult(await resendEnquiryNotifications(enquiryId));
    } catch {
      setResult({ ok: false, message: adminLabels.common.error });
    } finally {
      setPending(false);
      router.refresh();
    }
  }

  return (
    <div className="mt-5">
      <Button variant="surface" onClick={onClick} disabled={pending}>
        {pending ? (
          <Loader2 aria-hidden="true" className="animate-spin" />
        ) : (
          <RefreshCw aria-hidden="true" />
        )}
        {pending
          ? adminLabels.enquiries.resending
          : adminLabels.enquiries.resend}
      </Button>

      {result ? (
        <p
          role="status"
          className={
            result.ok
              ? "mt-3 rounded-xl border border-success/35 bg-success/10 px-4 py-3 text-xs text-[#bcd9a8]"
              : "mt-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-xs leading-relaxed text-[#e8bf80]"
          }
        >
          {result.message}
        </p>
      ) : null}
    </div>
  );
}