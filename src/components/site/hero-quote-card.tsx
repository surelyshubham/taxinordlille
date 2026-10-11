"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export const QUOTE_DRAFT_KEY = "tnl:quote-draft";

export type QuoteDraft = {
  fullName?: string;
  phone?: string;
  email?: string;
  pickupAddress?: string;
  destinationAddress?: string;
  serviceType?: "gare" | "aeroport" | "longue_distance";
  departureDate?: string;
  departureTime?: string;
  passengers?: number;
  returnJourney?: boolean;
  returnDate?: string;
  returnTime?: string;
  flightOrTrainNumber?: string;
  luggageNotes?: string;
  message?: string;
  company?: string;
  billingReference?: string;
};

/**
 * Hero quick-quote card.
 *
 * Asks only for the three things needed to open a conversation, then carries
 * the answers across to the full form. Values travel via `sessionStorage`
 * rather than the query string so customer addresses and phone numbers never
 * end up in browser history, server logs or referrer headers.
 */
export function HeroQuoteCard({
  quoteHref,
  title,
  note,
  labels,
  className,
}: {
  quoteHref: string;
  title: string;
  note: string;
  labels: {
    phone: string;
    pickupAddress: string;
    destinationAddress: string;
    submit: string;
    submitting: string;
    errors: {
      phone: string;
      pickupAddress: string;
      destinationAddress: string;
    };
  };
  className?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [values, setValues] = React.useState({
    phone: "",
    pickupAddress: "",
    destinationAddress: "",
  });

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const next: Record<string, string> = {};
    const phoneDigits = values.phone.replace(/\D/g, "");

    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      next.phone = labels.errors.phone;
    }
    if (values.pickupAddress.trim().length < 3) {
      next.pickupAddress = labels.errors.pickupAddress;
    }
    if (values.destinationAddress.trim().length < 3) {
      next.destinationAddress = labels.errors.destinationAddress;
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPending(true);

    const draft: QuoteDraft = {
      phone: values.phone.trim(),
      pickupAddress: values.pickupAddress.trim(),
      destinationAddress: values.destinationAddress.trim(),
    };

    try {
      window.sessionStorage.setItem(QUOTE_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Private-mode storage failures must not block the journey to the form.
    }

    router.push(quoteHref);
  };

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={cn("surface-panel rounded-2xl p-6 sm:p-7", className)}
    >
      <h2 className="text-lg">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-content-muted">{note}</p>

      <div className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="quick-phone">{labels.phone}</Label>
          <Input
            id="quick-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="06 00 00 00 00"
            value={values.phone}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "quick-phone-error" : undefined}
            onChange={(event) => setValues((v) => ({ ...v, phone: event.target.value }))}
            className="h-11"
          />
          {errors.phone ? (
            <p id="quick-phone-error" role="alert" className="text-xs text-danger">
              {errors.phone}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="quick-pickup">{labels.pickupAddress}</Label>
          <Input
            id="quick-pickup"
            name="pickupAddress"
            autoComplete="street-address"
            placeholder="Gare Lille-Flandres"
            value={values.pickupAddress}
            aria-invalid={Boolean(errors.pickupAddress)}
            aria-describedby={
              errors.pickupAddress ? "quick-pickup-error" : undefined
            }
            onChange={(event) =>
              setValues((v) => ({ ...v, pickupAddress: event.target.value }))
            }
            className="h-11"
          />
          {errors.pickupAddress ? (
            <p id="quick-pickup-error" role="alert" className="text-xs text-danger">
              {errors.pickupAddress}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="quick-destination">{labels.destinationAddress}</Label>
          <Input
            id="quick-destination"
            name="destinationAddress"
            placeholder="Hôtel, aéroport, gare…"
            value={values.destinationAddress}
            aria-invalid={Boolean(errors.destinationAddress)}
            aria-describedby={
              errors.destinationAddress ? "quick-destination-error" : undefined
            }
            onChange={(event) =>
              setValues((v) => ({ ...v, destinationAddress: event.target.value }))
            }
            className="h-11"
          />
          {errors.destinationAddress ? (
            <p id="quick-destination-error" role="alert" className="text-xs text-danger">
              {errors.destinationAddress}
            </p>
          ) : null}
        </div>
      </div>

      <Button type="submit" size="lg" block className="mt-6" disabled={pending}>
        {pending ? (
          <>
            <Loader2 aria-hidden="true" className="animate-spin" />
            {labels.submitting}
          </>
        ) : (
          <>
            {labels.submit}
            <ArrowRight aria-hidden="true" />
          </>
        )}
      </Button>
    </form>
  );
}