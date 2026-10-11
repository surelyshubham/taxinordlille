"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";

import type { FaqEntry } from "@/lib/content/faqs";
import { cn } from "@/lib/utils";

/**
 * Disclosure list built on Radix Accordion, so keyboard support, ARIA wiring
 * and expand/collapse state all come from a maintained primitive rather than
 * hand-rolled `useState`.
 */
export function FaqAccordion({
  items,
  className,
}: {
  items: FaqEntry[];
  className?: string;
}) {
  return (
    <AccordionPrimitive.Root
      type="single"
      collapsible
      className={cn("divide-y divide-line border-y border-line", className)}
    >
      {items.map((item, index) => (
        <AccordionPrimitive.Item
          key={item.question}
          value={`item-${index}`}
          className="group"
        >
          <AccordionPrimitive.Header className="flex">
            <AccordionPrimitive.Trigger
              className={cn(
                "group flex flex-1 items-start justify-between gap-6 py-6 text-left",
                "font-[family-name:var(--font-display)] text-lg text-content transition-colors",
                "hover:text-gold-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-400",
              )}
            >
              {item.question}
              <Plus
                aria-hidden="true"
                className="mt-1 size-5 shrink-0 text-gold-500 transition-transform duration-300 group-data-[state=open]:rotate-45"
              />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>

          <AccordionPrimitive.Content
            className="overflow-hidden data-[state=closed]:animate-none"
          >
            <div
              className={cn(
                "pb-6 pr-10 text-[0.975rem] leading-relaxed text-content-muted",
                "data-[state=closed]:animate-none",
              )}
            >
              {item.answer}
            </div>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  );
}