"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { adminLabels } from "@/lib/admin/labels";

import { saveSettingsAction, type SettingsState } from "./actions";

type Values = {
  businessName: string;
  tagline: string;
  phone: string;
  phoneDisplay: string;
  whatsappNumber: string;
  email: string;
  address: { street: string; postalCode: string; city: string; country: string };
  coverageArea: string;
  openingHours: string;
  social: { facebook: string; instagram: string; linkedin: string; x: string };
  seo: {
    defaultTitle: string;
    defaultDescription: string;
    ogImageUrl: string;
    city: string;
    postalCode: string;
    countryCode: string;
    latitude: string;
    longitude: string;
  };
  legal: {
    legalName: string;
    siret: string;
    rcs: string;
    vatNumber: string;
    insuranceInsurer: string;
    hostingProvider: string;
    dataRetentionMonths: number;
  };
  notifications: {
    emailTo: string;
    emailFrom: string;
    sendCustomerAcknowledgement: boolean;
    whatsappRecipient: string;
  };
};

export function SettingsForm({ values }: { values: Values }) {
  const router = useRouter();
  const [state, setState] = React.useState<SettingsState>({ status: "idle" });
  const [saving, setSaving] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setState({ status: "idle" });

    const formData = new FormData(event.currentTarget);

    let result: SettingsState;
    try {
      result = await saveSettingsAction(formData);
    } catch {
      result = { status: "error", message: adminLabels.settings.saveFailed };
    }

    setSaving(false);
    setState(result);
    if (result.status === "saved") router.refresh();
  }

  const errors = state.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {state.message ? (
        <p
          role="status"
          className={
            state.status === "saved"
              ? "rounded-xl border border-success/35 bg-success/10 px-4 py-3 text-sm text-[#bcd9a8]"
              : "rounded-xl border border-danger/45 bg-danger/10 px-4 py-3 text-sm text-[#eba295]"
          }
        >
          {state.message}
        </p>
      ) : null}

      {/* --- Identity --- */}
      <Section title={adminLabels.settings.business}>
        <Field
          id="businessName"
          label={adminLabels.settings.businessName}
          required
          error={errors.businessName}
        >
          {({ id, invalid }) => (
            <Input
              id={id}
              name="businessName"
              defaultValue={values.businessName}
              aria-invalid={invalid}
            />
          )}
        </Field>

        <Field id="tagline" label={adminLabels.settings.tagline}>
          {({ id }) => (
            <Input id={id} name="tagline" defaultValue={values.tagline} />
          )}
        </Field>
      </Section>

      {/* --- Contact --- */}
      <Section title={adminLabels.settings.contact}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="phone" label={adminLabels.settings.phone} required error={errors.phone}>
            {({ id, invalid }) => (
              <Input
                id={id}
                name="phone"
                defaultValue={values.phone}
                aria-invalid={invalid}
              />
            )}
          </Field>

          <Field
            id="phoneDisplay"
            label={adminLabels.settings.phoneDisplay}
            hint={adminLabels.settings.phoneDisplayHint}
          >
            {({ id }) => (
              <Input
                id={id}
                name="phoneDisplay"
                defaultValue={values.phoneDisplay}
              />
            )}
          </Field>

          <Field
            id="whatsappNumber"
            label={adminLabels.settings.whatsappNumber}
            hint={adminLabels.settings.whatsappHint}
            error={errors.whatsappNumber}
          >
            {({ id, invalid }) => (
              <Input
                id={id}
                name="whatsappNumber"
                defaultValue={values.whatsappNumber}
                placeholder="33612345678"
                inputMode="numeric"
                aria-invalid={invalid}
              />
            )}
          </Field>

          <Field id="email" label={adminLabels.settings.email} error={errors.email}>
            {({ id, invalid }) => (
              <Input
                id={id}
                name="email"
                type="email"
                defaultValue={values.email}
                aria-invalid={invalid}
              />
            )}
          </Field>
        </div>

        <fieldset className="space-y-5 border-t border-line pt-5">
          <legend className="text-sm font-medium text-gold-200">
            {adminLabels.settings.address}
          </legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id="address.street"
              label={adminLabels.settings.street}
              className="sm:col-span-2"
            >
              {({ id }) => (
                <Input
                  id={id}
                  name="address.street"
                  defaultValue={values.address.street}
                />
              )}
            </Field>
            <Field id="address.postalCode" label={adminLabels.settings.postalCode}>
              {({ id }) => (
                <Input
                  id={id}
                  name="address.postalCode"
                  defaultValue={values.address.postalCode}
                />
              )}
            </Field>
            <Field id="address.city" label={adminLabels.settings.city}>
              {({ id }) => (
                <Input
                  id={id}
                  name="address.city"
                  defaultValue={values.address.city}
                />
              )}
            </Field>
            <Field id="address.country" label={adminLabels.settings.country}>
              {({ id }) => (
                <Input
                  id={id}
                  name="address.country"
                  defaultValue={values.address.country}
                />
              )}
            </Field>
          </div>
        </fieldset>

        <Field id="coverageArea" label={adminLabels.settings.coverageArea}>
          {({ id }) => (
            <Textarea
              id={id}
              name="coverageArea"
              defaultValue={values.coverageArea}
              rows={2}
            />
          )}
        </Field>

        <Field id="openingHours" label={adminLabels.settings.openingHours}>
          {({ id }) => (
            <Textarea
              id={id}
              name="openingHours"
              defaultValue={values.openingHours}
              rows={3}
            />
          )}
        </Field>
      </Section>

      {/* --- Social --- */}
      <Section title={adminLabels.settings.social}>
        <div className="grid gap-5 sm:grid-cols-2">
          <SocialField id="social.facebook" label="Facebook" defaultValue={values.social.facebook} />
          <SocialField id="social.instagram" label="Instagram" defaultValue={values.social.instagram} />
          <SocialField id="social.linkedin" label="LinkedIn" defaultValue={values.social.linkedin} />
          <SocialField id="social.x" label="X" defaultValue={values.social.x} />
        </div>
      </Section>

      {/* --- SEO --- */}
      <Section title={adminLabels.settings.seo}>
        <Field
          id="seo.defaultTitle"
          label={adminLabels.settings.seoTitle}
          hint={adminLabels.settings.seoTitleHint}
        >
          {({ id }) => (
            <Input
              id={id}
              name="seo.defaultTitle"
              defaultValue={values.seo.defaultTitle}
              maxLength={80}
            />
          )}
        </Field>

        <Field
          id="seo.defaultDescription"
          label={adminLabels.settings.seoDescription}
          hint={adminLabels.settings.seoDescriptionHint}
        >
          {({ id }) => (
            <Textarea
              id={id}
              name="seo.defaultDescription"
              defaultValue={values.seo.defaultDescription}
              maxLength={200}
              rows={3}
            />
          )}
        </Field>

        <Field id="seo.ogImageUrl" label={adminLabels.settings.ogImageUrl}>
          {({ id }) => (
            <Input
              id={id}
              name="seo.ogImageUrl"
              defaultValue={values.seo.ogImageUrl}
            />
          )}
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="seo.city" label={adminLabels.settings.city}>
            {({ id }) => (
              <Input id={id} name="seo.city" defaultValue={values.seo.city} />
            )}
          </Field>
          <Field id="seo.postalCode" label={adminLabels.settings.postalCodeSeo}>
            {({ id }) => (
              <Input
                id={id}
                name="seo.postalCode"
                defaultValue={values.seo.postalCode}
              />
            )}
          </Field>
          <Field id="seo.countryCode" label={adminLabels.settings.countryCode}>
            {({ id }) => (
              <Input
                id={id}
                name="seo.countryCode"
                defaultValue={values.seo.countryCode}
                maxLength={2}
              />
            )}
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field id="seo.latitude" label={adminLabels.settings.latitude}>
              {({ id }) => (
                <Input
                  id={id}
                  name="seo.latitude"
                  defaultValue={values.seo.latitude}
                />
              )}
            </Field>
            <Field id="seo.longitude" label={adminLabels.settings.longitude}>
              {({ id }) => (
                <Input
                  id={id}
                  name="seo.longitude"
                  defaultValue={values.seo.longitude}
                />
              )}
            </Field>
          </div>
        </div>
      </Section>

      {/* --- Legal --- */}
      <Section title={adminLabels.settings.legal}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="legal.legalName"
            label={adminLabels.settings.legalName}
            className="sm:col-span-2"
          >
            {({ id }) => (
              <Input
                id={id}
                name="legal.legalName"
                defaultValue={values.legal.legalName}
              />
            )}
          </Field>
          <Field id="legal.siret" label={adminLabels.settings.siret}>
            {({ id }) => (
              <Input id={id} name="legal.siret" defaultValue={values.legal.siret} />
            )}
          </Field>
          <Field id="legal.rcs" label={adminLabels.settings.rcs}>
            {({ id }) => (
              <Input id={id} name="legal.rcs" defaultValue={values.legal.rcs} />
            )}
          </Field>
          <Field id="legal.vatNumber" label={adminLabels.settings.vatNumber}>
            {({ id }) => (
              <Input
                id={id}
                name="legal.vatNumber"
                defaultValue={values.legal.vatNumber}
              />
            )}
          </Field>
          <Field
            id="legal.insuranceInsurer"
            label={adminLabels.settings.insuranceInsurer}
          >
            {({ id }) => (
              <Input
                id={id}
                name="legal.insuranceInsurer"
                defaultValue={values.legal.insuranceInsurer}
              />
            )}
          </Field>
          <Field
            id="legal.hostingProvider"
            label={adminLabels.settings.hostingProvider}
          >
            {({ id }) => (
              <Input
                id={id}
                name="legal.hostingProvider"
                defaultValue={values.legal.hostingProvider}
              />
            )}
          </Field>
          <Field
            id="legal.dataRetentionMonths"
            label={adminLabels.settings.retention}
            hint={adminLabels.settings.retentionHint}
          >
            {({ id }) => (
              <Input
                id={id}
                name="legal.dataRetentionMonths"
                type="number"
                min={1}
                max={120}
                defaultValue={values.legal.dataRetentionMonths}
              />
            )}
          </Field>
        </div>
      </Section>

      {/* --- Notifications --- */}
      <Section title={adminLabels.settings.notifications}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="notifications.emailTo"
            label={adminLabels.settings.emailTo}
            error={errors["notifications.emailTo"]}
          >
            {({ id, invalid }) => (
              <Input
                id={id}
                name="notifications.emailTo"
                type="email"
                defaultValue={values.notifications.emailTo}
                aria-invalid={invalid}
              />
            )}
          </Field>

          <Field
            id="notifications.emailFrom"
            label={adminLabels.settings.emailFrom}
            hint={adminLabels.settings.emailFromHint}
          >
            {({ id }) => (
              <Input
                id={id}
                name="notifications.emailFrom"
                type="email"
                defaultValue={values.notifications.emailFrom}
              />
            )}
          </Field>

          <Field
            id="notifications.whatsappRecipient"
            label={adminLabels.settings.whatsappRecipient}
          >
            {({ id }) => (
              <Input
                id={id}
                name="notifications.whatsappRecipient"
                defaultValue={values.notifications.whatsappRecipient}
                inputMode="numeric"
              />
            )}
          </Field>
        </div>

        <label className="flex items-start gap-3 text-sm text-content">
          <input
            type="checkbox"
            name="sendCustomerAcknowledgement"
            defaultChecked={values.notifications.sendCustomerAcknowledgement}
            className="mt-1 size-4 shrink-0 accent-[#d4b668]"
          />
          {adminLabels.settings.sendAcknowledgement}
        </label>
      </Section>

      <div className="sticky bottom-4 flex justify-end">
        <Button type="submit" size="lg" disabled={saving} className="shadow-lift">
          {saving ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : (
            <Save aria-hidden="true" />
          )}
          {saving
            ? adminLabels.settings.saving
            : adminLabels.settings.save}
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card space-y-5 rounded-2xl p-6">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-500">
        {title}
      </h2>
      {children}
    </section>
  );
}

function SocialField({
  id,
  label,
  defaultValue,
}: {
  id: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <Field id={id} label={label}>
      {({ id: fieldId }) => (
        <Input
          id={fieldId}
          name={id}
          type="url"
          defaultValue={defaultValue}
          placeholder="https://…"
        />
      )}
    </Field>
  );
}