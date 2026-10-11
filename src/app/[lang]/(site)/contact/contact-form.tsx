"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CheckCircle2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Spinner } from "@/components/ui/primitives";
import type { Locale } from "@/lib/i18n/config";
import {
  contactMessageSchema,
  type ContactErrorKey,
  type ContactMessageValues,
} from "@/lib/validation/contact";

import { submitContactMessage, type ContactActionResult } from "./actions";

type Labels = {
  locale: Locale;
  fields: Record<string, string>;
  subjects: Record<string, string>;
  errors: Record<ContactErrorKey, string>;
  submit: string;
  submitting: string;
  successTitle: string;
  successTemplate: string;
  optionalLabel: string;
};

type FormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; errors?: Record<string, ContactErrorKey>; formError?: ContactErrorKey };

export function ContactForm({ labels }: { labels: Labels }) {
  const [state, setState] = React.useState<FormState>({ status: "idle" });
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<ContactMessageValues>({
    resolver: zodResolver(contactMessageSchema),
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      subject: "general",
      message: "",
      website: "",
    },
  });

  const messageFor = React.useCallback(
    (key?: ContactErrorKey) => (key ? labels.errors[key] : undefined),
    [labels.errors],
  );

  const serverErrors = state.status === "error" ? state.errors : undefined;
  const formError = state.status === "error" ? state.formError : undefined;

  const onSubmit = form.handleSubmit(
    async (values) => {
      setSubmitting(true);
      setState({ status: "idle" });

      const payload = new FormData();
      payload.set("locale", labels.locale);
      for (const [key, value] of Object.entries(values)) {
        payload.set(key, String(value));
      }

      let result: ContactActionResult;
      try {
        result = await submitContactMessage(payload);
      } catch {
        result = { status: "error", formError: "generic" };
      }

      setSubmitting(false);

      if (result.status === "success") {
        form.reset();
        setState({ status: "success" });
        return;
      }

      setState({
        status: "error",
        errors: result.errors,
        formError: result.formError,
      });
    },
    () => setState({ status: "idle" }),
  );

  if (state.status === "success") {
    return (
      <div className="surface-panel rounded-2xl p-8 text-center sm:p-12">
        <span className="mx-auto inline-flex size-16 items-center justify-center rounded-full border border-gold-600/60 bg-gold-400/10 text-gold-300">
          <CheckCircle2 aria-hidden="true" className="size-8" />
        </span>
        <h3 className="mt-7 text-2xl">{labels.successTitle}</h3>
        <p className="mx-auto mt-4 max-w-md text-[0.975rem] leading-relaxed text-content-muted">
          {labels.successTemplate.replace("{name}", String(form.getValues("fullName") || ""))}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor="contact-website">Site web</label>
        <input
          id="contact-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...form.register("website")}
        />
      </div>

      {formError ? (
        <p role="alert" className="rounded-xl border border-danger/45 bg-danger/10 px-4 py-3 text-sm text-[#eba295]">
          {messageFor(formError)}
        </p>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          id="contact-fullName"
          label={labels.fields.name}
          required
          error={messageFor(form.formState.errors.fullName?.message as ContactErrorKey) ??
            messageFor(serverErrors?.name)}
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

        <Field
          id="contact-subject"
          label={labels.fields.subject}
          required
          error={messageFor(serverErrors?.subject)}
        >
          {({ id, describedBy, invalid }) => (
            <Select {...form.register("subject")} id={id} aria-describedby={describedBy} aria-invalid={invalid}>
              <option value="general">{labels.subjects.general}</option>
              <option value="quote">{labels.subjects.quote}</option>
              <option value="existing">{labels.subjects.existing}</option>
              <option value="other">{labels.subjects.other}</option>
            </Select>
          )}
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          id="contact-email"
          label={labels.fields.email}
          optionalLabel={labels.optionalLabel}
          error={messageFor(form.formState.errors.email?.message as ContactErrorKey) ??
            messageFor(serverErrors?.email)}
        >
          {({ id, describedBy, invalid }) => (
            <Input
              {...form.register("email")}
              id={id}
              type="email"
              autoComplete="email"
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          )}
        </Field>

        <Field
          id="contact-phone"
          label={labels.fields.phone}
          optionalLabel={labels.optionalLabel}
          error={messageFor(form.formState.errors.phone?.message as ContactErrorKey) ??
            messageFor(serverErrors?.phone)}
        >
          {({ id, describedBy, invalid }) => (
            <Input
              {...form.register("phone")}
              id={id}
              type="tel"
              autoComplete="tel"
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          )}
        </Field>
      </div>

      <Field
        id="contact-message"
        label={labels.fields.message}
        required
        error={messageFor(form.formState.errors.message?.message as ContactErrorKey) ??
          messageFor(serverErrors?.message) ??
          messageFor(serverErrors?.messageShort)}
      >
        {({ id, describedBy, invalid }) => (
          <Textarea
            {...form.register("message")}
            id={id}
            rows={7}
            aria-describedby={describedBy}
            aria-invalid={invalid}
          />
        )}
      </Field>

      <Button type="submit" size="lg" disabled={submitting}>
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
    </form>
  );
}