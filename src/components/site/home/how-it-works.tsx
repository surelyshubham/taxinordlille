import { AlertCircle, ClipboardList, PhoneCall, Send } from "lucide-react";

import { Section, SectionHeading } from "@/components/ui/primitives";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function HowItWorks({ dict }: { dict: Dictionary }) {
  const steps = [
    {
      icon: ClipboardList,
      title: dict.home.how.step1Title,
      body: dict.home.how.step1Body,
    },
    {
      icon: Send,
      title: dict.home.how.step2Title,
      body: dict.home.how.step2Body,
    },
    {
      icon: PhoneCall,
      title: dict.home.how.step3Title,
      body: dict.home.how.step3Body,
    },
  ];

  return (
    <Section className="border-t border-line/70 bg-surface/30">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow={dict.home.how.eyebrow}
          title={dict.home.how.title}
          description={dict.home.how.intro}
          align="center"
        />

        <ol className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === steps.length - 1;

            return (
              <li key={step.title} className="relative text-center md:text-left">
                {/* Connector rail, desktop only. */}
                {!isLast ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-[calc(50%+3rem)] right-[-2rem] top-7 hidden h-px bg-gradient-to-r from-gold-700/60 to-gold-700/10 md:block"
                  />
                ) : null}

                <div className="relative inline-flex flex-col items-center gap-5 md:flex-row md:items-start">
                  <span className="relative inline-flex size-14 shrink-0 items-center justify-center rounded-2xl border border-gold-700/50 bg-canvas text-gold-300">
                    <Icon aria-hidden="true" className="size-6" />
                    <span
                      aria-hidden="true"
                      className="absolute -right-2 -top-2 inline-flex size-6 items-center justify-center rounded-full border border-gold-600 bg-canvas font-[family-name:var(--font-display)] text-xs text-gold-300"
                    >
                      {index + 1}
                    </span>
                  </span>

                  <div>
                    <h3 className="text-lg leading-snug">{step.title}</h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-content-muted">
                      {step.body}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <p className="mx-auto mt-14 flex max-w-2xl items-start justify-center gap-3 rounded-xl border border-gold-800/50 bg-gold-400/[0.06] px-5 py-4 text-center text-sm leading-relaxed text-gold-200">
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{dict.home.how.disclaimer}</span>
        </p>
      </div>
    </Section>
  );
}