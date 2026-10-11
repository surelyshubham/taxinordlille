"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { deleteEnquiryAction } from "../actions";

/**
 * Permanent deletion of a single enquiry.
 *
 * This is the operator-facing counterpart to the documented retention SQL: it
 * exists so an explicit erasure request can be honoured without touching the
 * database by hand. Notification logs cascade automatically.
 */
export function DeleteEnquiry({ enquiryId }: { enquiryId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  return (
    <Button
      type="button"
      variant="danger"
      block
      disabled={pending}
      onClick={async () => {
        const confirmed = window.confirm(
          "Supprimer définitivement cette demande ? Cette action est irréversible et notamment nécessaire pour répondre à une demande d'effacement.",
        );
        if (!confirmed) return;

        setPending(true);
        await deleteEnquiryAction(enquiryId);
        router.push("/admin/demandes");
        router.refresh();
      }}
    >
      {pending ? (
        <Loader2 aria-hidden="true" className="animate-spin" />
      ) : (
        <Trash2 aria-hidden="true" />
      )}
      Supprimer la demande
    </Button>
  );
}