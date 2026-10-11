import { Section, SectionHeading } from "@/components/ui/primitives";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

/**
 * Trust section.
 *
 * Deliberately built from process commitments ("we confirm the price before
 * you commit") rather than statistics, testimonials or badges. None of those
 * can be printed until the owner has supplied real, verifiable numbers.
 */
export function WhyUs({ dict }: { dict: Dictionary }) {
  const items = [
    { title: dict.home.why.item1Title, body: dict.home.why.item1Body },
    { title: dict.home.why.item2Title, body: dict.home.why.item2Body },
    { title: dict.home.why.item3Title, body: dict.home.why.item3Body },
    { title: dict.home.why.item4Title, body: dict.home.why.item4Body },
    { title: dict.home.why.item5Title, body: dict.home.why.item5Body },
    { title: dict.home.why.item6Title, body: dict.home.why.item6Body },
  ];

  return (
    <Section className="border-t border-line/70">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow={dict.home.why.eyebrow}
          title={dict.home.why.title}
          description={dict.home.why.intro}
        />

        <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <li
              key={item.title}
              className="group relative bg-canvas p-7 transition-colors duration-300 hover:bg-surface-2"
            >
              <span
                aria-hidden="true"
                className="font-[family-name:var(--font-display)] text-4xl leading-none text-gold-800 transition-colors duration-300 group-hover:text-gold-600"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-lg leading-snug">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-content-muted">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}