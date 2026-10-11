import type { Metadata } from "next";

import { adminLabels } from "@/lib/admin/labels";
import { getSiteSettings } from "@/lib/settings";

import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: adminLabels.settings.title };

export default async function SettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="max-w-4xl space-y-8">
      <header>
        <h1 className="text-3xl">{adminLabels.settings.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-content-muted">
          {adminLabels.settings.subtitle}
        </p>
      </header>

      <SettingsForm
        values={{
          businessName: settings.businessName,
          tagline: settings.tagline,
          phone: settings.phone,
          phoneDisplay: settings.phoneDisplay,
          whatsappNumber: settings.whatsappNumber,
          email: settings.email,
          address: settings.address,
          coverageArea: settings.coverageArea,
          openingHours: settings.openingHours,
          social: settings.social,
          seo: settings.seo,
          legal: settings.legal,
          notifications: settings.notifications,
        }}
      />
    </div>
  );
}