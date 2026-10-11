"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { AlertCircle, CheckCircle2, PhoneCall, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CheckboxField, Input, Select, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Spinner } from "@/components/ui/primitives";
import type { Locale } from "@/lib/i18n/config";
import { todayInputValue } from "@/lib/utils";
import {
  quoteRequestSchema,
  type QuoteErrorKey,
  type QuoteRequestValues,
} from "@/lib/validation/quote";
import {
  QUOTE_DRAFT_KEY,
  type QuoteDraft,
} from "@/components/site/hero-quote-card";

import { submitQuoteRequest, type QuoteActionResult } from "./actions";

type Labels = {
  locale: Locale;
  sections: { contact: string; journey: string; details: string };
  fields: Record<string, string>;
  serviceTypes: Record<string, string>;
  errors: Record<QuoteErrorKey, string>;
  placeholders: Record<string, string>;
  consentPrefix: string;
  consentLink: string;
  submit: string;
  submitting: string;
  notBooking: string;
  successTitle: string;
  successTemplate: string;
  successNotConfirmed: string;
  errorTitle: string;
  newRequest: string;
  contactCta: string;
  contactHref: string;
  privacyHref: string;
  optionalLabel: string;
};

type FormState =
  | { status: "idle" }
  | { status: "success"; reference: string; businessNotified: boolean }
  | {
      status: "error";
      errors?: Record<string, QuoteErrorKey>;
      formError?: QuoteErrorKey;
    };

export function QuoteForm({
  labels,
  defaultServiceType,
}: {
  labels: Labels;
  defaultServiceType?: string;
}) {
  const [state, setState] = React.useState<FormState>({ status: "idle" });
  const [submitting, setSubmitting] = React.useState(false);

  const minDate = todayInputValue();

  const form = useForm<QuoteRequestValues>({
    resolver: zodResolver(quoteRequestSchema),
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      serviceType: (defaultServiceType as QuoteRequestValues["serviceType"]) ?? "gare",
      pickupAddress: "",
      destinationAddress: "",
      departureDate: "",
      departureTime: "",
      returnJourney: false,
      returnDate: "",
      returnTime: "",
      passengers: 1,
      flightOrTrainNumber: "",
      luggageNotes: "",
      message: "",
      company: "",
      billingReference: "",
      consent: false,
      website: "",
    },
  });

  // Pre-fill from the hero quick-quote card (sessionStorage, never the URL).
  React.useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(QUOTE_DRAFT_KEY);
      if (!raw) return;
      window.sessionStorage.removeItem(QUOTE_DRAFT_KEY);
      const draft = JSON.parse(raw) as QuoteDraft;
      form.reset({ ...form.getValues(), ...draft });
    } catch {
      // A malformed draft must never block the form.
    }
  }, [form]);

  /**
   * Messages come from the dictionary, keyed by the same names the server-side
   * validator produces, so client and server errors read identically.
   */
  const messageFor = React.useCallback(
    (key?: QuoteErrorKey): string | undefined =>
      key ? labels.errors[key] : undefined,
    [labels.errors],
  );

  const serverErrors = state.status === "error" ? state.errors : undefined;
  const formError = state.status === "error" ? state.formError : undefined;

  // `useWatch` subscribes to a single field; `form.watch()` re-renders the whole
  // form on every keystroke and is not safe to memoise.
  const returnJourney = useWatch({ control: form.control, name: "returnJourney" });
  const departureDate = useWatch({ control: form.control, name: "departureDate" });

  const onSubmit = form.handleSubmit(
    async (values) => {
      setSubmitting(true);
      setState({ status: "idle" });

      const payload = new FormData();
      payload.set("locale", labels.locale);
      for (const [key, value] of Object.entries(values)) {
        if (typeof value === "boolean") payload.set(key, String(value));
        else if (value !== undefined && value !== null) payload.set(key, String(value));
      }

      let result: QuoteActionResult;
      try {
        result = await submitQuoteRequest(payload);
      } catch {
        result = { status: "error", formError: "generic" };
      }

      setSubmitting(false);

      if (result.status === "success") {
        setState({
          status: "success",
          reference: result.reference,
          businessNotified: result.businessNotified,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      setState({
        status: "error",
        errors: result.errors,
        formError: result.formError,
      });

      // Move focus to the first field the server rejected.
      const firstKey = Object.keys(result.errors ?? {})[0];
      if (firstKey) {
        window.requestAnimationFrame(() => {
          document.getElementById(`quote-${firstKey}`)?.focus();
        });
      } else {
        document
          .getElementById("quote-form-error")
          ?.scrollIntoView({ block: "center" });
      }
    },
    // Client-side validation failed: RHF has already surfaced field errors.
    () => setState({ status: "idle" }),
  );

  if (state.status === "success") {
    return (
      <div className="surface-panel rounded-2xl p-8 text-center sm:p-12">
        <span className="mx-auto inline-flex size-16 items-center justify-center rounded-full border border-gold-600/60 bg-gold-400/10 text-gold-300">
          <CheckCircle2 aria-hidden="true" className="size-8" />
        </span>

        <h2 className="mt-7 text-2xl">{labels.successTitle}</h2>

        <p className="mx-auto mt-4 max-w-md text-[0.975rem] leading-relaxed text-content-muted">
          {labels.successTemplate
            .replace("{name}", String(form.getValues("fullName")))
            .replace("{ref}", state.reference)}
        </p>

        <p className="mx-auto mt-4 flex max-w-md items-start justify-center gap-2 text-sm leading-relaxed text-content-subtle">
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{labels.successNotConfirmed}</span>
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" variant="outline" onClick={() => setState({ status: "idle" })}>
            {labels.newRequest}
          </Button>
          <Button asChild>
            <Link href={labels.contactHref}>
              <PhoneCall aria-hidden="true" />
              {labels.contactCta}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-10">
      {/* Honeypot — visually and programmatically hidden from real users. */}
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor="quote-website">Site web</label>
        <input
          id="quote-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...form.register("website")}
        />
      </div>

      {formError ? (
        <p
          id="quote-form-error"
          role="alert"
          className="rounded-xl border border-danger/45 bg-danger/10 px-4 py-3 text-sm text-[#eba295]"
        >
          {messageFor(formError)}
        </p>
      ) : null}

      {/* --- Contact --------------------------------------------------- */}
      <fieldset className="space-y-6">
        <legend className="font-[family-name:var(--font-display)] text-xl">
          {labels.sections.contact}
        </legend>

        <Field
          id="quote-fullName"
          label={labels.fields.fullName}
          required
          error={messageFor(form.formState.errors.fullName?.message as QuoteErrorKey) ??
            messageFor(serverErrors?.fullName)}
        >
          {({ id, describedBy, invalid }) => (
            <Input
              {...form.register("fullName")}
              id={id}
              autoComplete="name"
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          )}
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            id="quote-phone"
            label={labels.fields.phone}
            required
            error={messageFor(form.formState.errors.phone?.message as QuoteErrorKey) ??
              messageFor(serverErrors?.phone)}
          >
            {({ id, describedBy, invalid }) => (
              <Input
                {...form.register("phone")}
                id={id}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="06 00 00 00 00"
                aria-describedby={describedBy}
                aria-invalid={invalid}
              />
            )}
          </Field>

          <Field
            id="quote-email"
            label={labels.fields.email}
            optionalLabel={labels.optionalLabel}
            error={messageFor(form.formState.errors.email?.message as QuoteErrorKey) ??
              messageFor(serverErrors?.email)}
          >
            {({ id, describedBy, invalid }) => (
              <Input
                {...form.register("email")}
                id={id}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="vous@exemple.fr"
                aria-describedby={describedBy}
                aria-invalid={invalid}
              />
            )}
          </Field>
        </div>
      </fieldset>

      <div className="rule-gold" />

      {/* --- Journey ---------------------------------------------------- */}
      <fieldset className="space-y-6">
        <legend className="font-[family-name:var(--font-display)] text-xl">
          {labels.sections.journey}
        </legend>

        <Field
          id="quote-serviceType"
          label={labels.fields.serviceType}
          required
          error={messageFor(serverErrors?.serviceType)}
        >
          {({ id, describedBy, invalid }) => (
            <Controller
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <Select
                  {...field}
                  id={id}
                  ref={field.ref}
                  value={field.value ?? ""}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  onChange={(event) => {
                    field.onChange(event);
                    // Reflect the change in the address bar for shareable links.
                    const url = new URL(window.location.href);
                    url.searchParams.set("service", event.target.value);
                    window.history.replaceState(null, "", url);
                  }}
                >
                  <option value="">—</option>
                  <option value="gare">{labels.serviceTypes.gare}</option>
                  <option value="aeroport">{labels.serviceTypes.aeroport}</option>
                  <option value="longue_distance">
                    {labels.serviceTypes.longue_distance}
                  </option>
                </Select>
              )}
            />
          )}
        </Field>

        <Field
          id="quote-pickupAddress"
          label={labels.fields.pickupAddress}
          required
          error={messageFor(form.formState.errors.pickupAddress?.message as QuoteErrorKey) ??
            messageFor(serverErrors?.pickupAddress)}
        >
          {({ id, describedBy, invalid }) => (
            <Input
              {...form.register("pickupAddress")}
              id={id}
              autoComplete="street-address"
              placeholder={labels.placeholders.pickupAddress}
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          )}
        </Field>

        <Field
          id="quote-destinationAddress"
          label={labels.fields.destinationAddress}
          required
          error={messageFor(form.formState.errors.destinationAddress?.message as QuoteErrorKey) ??
            messageFor(serverErrors?.destinationAddress) ??
            messageFor(serverErrors?.addressSame)}
        >
          {({ id, describedBy, invalid }) => (
            <Input
              {...form.register("destinationAddress")}
              id={id}
              placeholder={labels.placeholders.destinationAddress}
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          )}
        </Field>

        <div className="grid gap-6 sm:grid-cols-3">
          <Field
            id="quote-departureDate"
            label={labels.fields.departureDate}
            required
            error={messageFor(serverErrors?.departureDate) ??
              messageFor(serverErrors?.departureDatePast)}
          >
            {({ id, describedBy, invalid }) => (
              <Input
                {...form.register("departureDate")}
                id={id}
                type="date"
                min={minDate}
                aria-describedby={describedBy}
                aria-invalid={invalid}
              />
            )}
          </Field>

          <Field
            id="quote-departureTime"
            label={labels.fields.departureTime}
            required
            error={messageFor(serverErrors?.departureTime)}
          >
            {({ id, describedBy, invalid }) => (
              <Input
                {...form.register("departureTime")}
                id={id}
                type="time"
                aria-describedby={describedBy}
                aria-invalid={invalid}
              />
            )}
          </Field>

          <Field
            id="quote-passengers"
            label={labels.fields.passengers}
            required
            error={messageFor(form.formState.errors.passengers?.message as QuoteErrorKey) ??
              messageFor(serverErrors?.passengers)}
          >
            {({ id, describedBy, invalid }) => (
              <Select
                {...form.register("passengers", { valueAsNumber: true })}
                id={id}
                aria-describedby={describedBy}
                aria-invalid={invalid}
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <Controller
          control={form.control}
          name="returnJourney"
          render={({ field }) => (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line-strong bg-surface-2/50 px-4 py-3.5 transition-colors hover:border-gold-700/70">
              <CheckboxField
                checked={field.value}
                onChange={(event) => field.onChange(event.target.checked)}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
              <span className="text-sm leading-relaxed text-content">
                {labels.fields.returnJourney}
              </span>
            </label>
          )}
        />

        {returnJourney ? (
          <div className="grid gap-6 rounded-xl border border-gold-800/40 bg-gold-400/[0.04] p-5 sm:grid-cols-2">
            <Field
              id="quote-returnDate"
              label={labels.fields.returnDate}
              required
              error={messageFor(serverErrors?.returnDate) ??
                messageFor(serverErrors?.returnDatePast)}
            >
              {({ id, describedBy, invalid }) => (
                <Input
                  {...form.register("returnDate")}
                  id={id}
                  type="date"
                  min={departureDate || minDate}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                />
              )}
            </Field>

            <Field
              id="quote-returnTime"
              label={labels.fields.returnTime}
              required
              error={messageFor(serverErrors?.returnTime)}
            >
              {({ id, describedBy, invalid }) => (
                <Input
                  {...form.register("returnTime")}
                  id={id}
                  type="time"
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                />
              )}
            </Field>

            {serverErrors?.returnBeforeDeparture ? (
              <p role="alert" className="text-xs text-danger sm:col-span-2">
                {messageFor("returnBeforeDeparture")}
              </p>
            ) : null}
          </div>
        ) : null}
      </fieldset>

      <div className="rule-gold" />

      {/* --- Details ---------------------------------------------------- */}
      <fieldset className="space-y-6">
        <legend className="font-[family-name:var(--font-display)] text-xl">
          {labels.sections.details}
        </legend>

        <Field
          id="quote-flightOrTrainNumber"
          label={labels.fields.flightOrTrainNumber}
          optionalLabel={labels.optionalLabel}
        >
          {({ id }) => (
            <Input
              {...form.register("flightOrTrainNumber")}
              id={id}
              placeholder={labels.placeholders.flightOrTrainNumber}
            />
          )}
        </Field>

        <Field id="quote-luggageNotes" label={labels.fields.luggage} optionalLabel={labels.optionalLabel}>
          {({ id }) => (
            <Textarea
              {...form.register("luggageNotes")}
              id={id}
              rows={3}
              placeholder={labels.placeholders.luggage}
            />
          )}
        </Field>

        <Field id="quote-message" label={labels.fields.message} optionalLabel={labels.optionalLabel}>
          {({ id }) => (
            <Textarea
              {...form.register("message")}
              id={id}
              rows={3}
              placeholder={labels.placeholders.message}
            />
          )}
        </Field>

        <details className="group rounded-xl border border-line-strong bg-surface-2/40 px-5 py-4">
          <summary className="cursor-pointer list-none text-sm font-medium text-gold-300 marker:hidden">
            {labels.fields.company} · {labels.fields.reference}
          </summary>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <Field id="quote-company" label={labels.fields.company} optionalLabel={labels.optionalLabel}>
              {({ id }) => (
                <Input {...form.register("company")} id={id} autoComplete="organization" />
              )}
            </Field>
            <Field
              id="quote-billingReference"
              label={labels.fields.reference}
              optionalLabel={labels.optionalLabel}
            >
              {({ id }) => <Input {...form.register("billingReference")} id={id} />}
            </Field>
          </div>
        </details>
      </fieldset>

      <div className="rule-gold" />

      {/* --- Consent ---------------------------------------------------- */}
      <Controller
        control={form.control}
        name="consent"
        render={({ field }) => (
          <div>
            <label className="flex cursor-pointer items-start gap-3">
              <CheckboxField
                checked={field.value === true}
                onChange={(event) => field.onChange(event.target.checked)}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                aria-invalid={Boolean(
                  form.formState.errors.consent || serverErrors?.consent,
                )}
              />
              <span className="text-sm leading-relaxed text-content-muted">
                {labels.consentPrefix}
                <Link
                  href={labels.privacyHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold-300 underline underline-offset-4 hover:text-gold-200"
                >
                  {labels.consentLink}
                </Link>
              </span>
            </label>
            {form.formState.errors.consent || serverErrors?.consent ? (
              <p role="alert" className="mt-2 text-xs font-medium text-danger">
                {messageFor("consent")}
              </p>
            ) : null}
          </div>
        )}
      />

      <div className="flex flex-col gap-4">
        <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? (
            <>
              <Spinner />
              {labels.submitting}
            </>
          ) : (
            <>
              <Send aria-hidden="true" />
              {labels.submit}
            </>
          )}
        </Button>

        <p className="text-xs leading-relaxed text-content-subtle">
          {labels.notBooking}
        </p>
      </div>
    </form>
  );
}