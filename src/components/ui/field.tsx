import * as React from "react";

import { cn } from "@/lib/utils";
import { Label as LabelPrimitive } from "@radix-ui/react-label";

export function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive>) {
  return (
    <LabelPrimitive
      className={cn(
        "text-sm font-medium leading-none text-gold-200",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

/**
 * A labelled form control with validation message and hint text.
 *
 * Wires `aria-invalid`, `aria-describedby` and an `id` automatically so every
 * field in the public forms is announced correctly by screen readers without
 * repeating the plumbing at each call site.
 */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  optionalLabel,
  className,
  children,
  action,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  optionalLabel?: string;
  className?: string;
  children: (ids: {
    id: string;
    describedBy: string | undefined;
    invalid: boolean;
  }) => React.ReactNode;
  action?: React.ReactNode;
}) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id}>
          {label}
          {required ? (
            <span aria-hidden="true" className="ml-1 text-gold-400">
              *
            </span>
          ) : optionalLabel ? (
            <span className="ml-1.5 text-xs font-normal text-content-subtle">
              ({optionalLabel})
            </span>
          ) : null}
        </Label>
        {action}
      </div>

      {children({ id, describedBy, invalid: Boolean(error) })}

      {hint && !error ? (
        <p id={hintId} className="text-xs leading-relaxed text-content-subtle">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-xs font-medium leading-relaxed text-danger"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="mt-px size-3.5 shrink-0"
            fill="currentColor"
          >
            <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm0 3a.9.9 0 0 1 .9.9v3.2a.9.9 0 1 1-1.8 0V5.4A.9.9 0 0 1 8 4.5Zm0 7.6a1.05 1.05 0 1 1 0-2.1 1.05 1.05 0 0 1 0 2.1Z" />
          </svg>
          {error}
        </p>
      ) : null}
    </div>
  );
}