import * as React from "react";

import { cn } from "@/lib/utils";

const fieldBase = [
  "w-full rounded-xl border border-line-strong bg-surface-2/70 px-4 text-[0.95rem]",
  "text-content placeholder:text-content-subtle",
  "transition-colors duration-200",
  "hover:border-gold-700/70",
  "focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/25",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/25",
].join(" ");

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, type = "text", ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(fieldBase, "h-12", className)}
      {...props}
    />
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        fieldBase,
        "min-h-28 resize-y py-3 leading-relaxed",
        className,
      )}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(fieldBase, "h-12 appearance-none pr-11", className)}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-gold-400"
      >
        <path
          d="m5 7.5 5 5 5-5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
});

/**
 * Checkbox with a tick drawn in the canvas colour once checked.
 * The tick is a sibling SVG toggled by `peer-checked`, which keeps the control
 * a real, keyboard-accessible `<input type="checkbox">`.
 */
export const CheckboxField = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function CheckboxField({ className, ...props }, ref) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          "peer size-[1.15rem] cursor-pointer appearance-none rounded-[5px]",
          "border border-line-strong bg-surface-2 transition-colors",
          "checked:border-gold-400 checked:bg-gold-400",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400",
        )}
        {...props}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="pointer-events-none absolute left-0 top-0 size-[1.15rem] opacity-0 peer-checked:opacity-100"
      >
        <path
          d="m3.5 8.5 3 3 6-7"
          fill="none"
          stroke="#050404"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
});