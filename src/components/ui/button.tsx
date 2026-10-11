import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-semibold transition-[background-color,color,border-color,box-shadow,transform] duration-200",
    "disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:shrink-0 [&_svg]:pointer-events-none",
  ].join(" "),
  {
    variants: {
      variant: {
        /** Primary call to action: gold on black. */
        primary:
          "bg-gold-400 text-canvas hover:bg-gold-300 active:bg-gold-500 shadow-[0_10px_30px_-12px_rgba(212,175,55,0.55)]",
        /** Gold outline — used next to primary buttons. */
        outline:
          "border border-gold-400/45 text-gold-200 hover:border-gold-400 hover:bg-gold-400/10",
        /** Low-contrast action for dense surfaces. */
        ghost:
          "text-gold-200 hover:bg-gold-400/10 hover:text-gold-100",
        /** Solid, brand-neutral surface button. */
        surface:
          "border border-line-strong bg-surface-2 text-content hover:border-gold-400/40 hover:text-gold-100",
        /** Destructive admin action. */
        danger:
          "border border-danger/40 text-danger hover:bg-danger/12 hover:border-danger/70",
        /** WhatsApp — keeps the platform's own colour family, legible on black. */
        whatsapp:
          "border border-[#25D366]/45 text-[#7ff0a8] hover:bg-[#25D366]/12 hover:border-[#25D366]/80",
      },
      size: {
        sm: "h-9 rounded-lg px-3.5 text-sm [&_svg]:size-4",
        md: "h-11 rounded-xl px-5 text-[0.95rem] [&_svg]:size-[1.05rem]",
        lg: "h-[3.25rem] rounded-xl px-7 text-base [&_svg]:size-5",
        icon: "size-11 rounded-xl [&_svg]:size-5",
        "icon-sm": "size-9 rounded-lg [&_svg]:size-4",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    />
  );
}

export { buttonVariants };