import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { adminLabels } from "@/lib/admin/labels";
import { isLocale } from "@/lib/i18n/config";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: adminLabels.auth.title,
  robots: { index: false, follow: false, nocache: true },
};

/** Admin sign-in. Reachable without a session; everything else is guarded. */
export default async function LoginPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/brand/logo-seal.png"
            alt="Taxi Nord Lille"
            width={512}
            height={512}
            className="size-24"
            priority
          />
          <h1 className="mt-7 text-3xl">{adminLabels.auth.title}</h1>
          <p className="mt-3 text-sm text-content-muted">
            {adminLabels.auth.subtitle}
          </p>
        </div>

        <div className="mt-10">
          <LoginForm />
        </div>

        <p className="mt-8 rounded-xl border border-line-strong bg-surface/60 px-4 py-3 text-center text-xs leading-relaxed text-content-subtle">
          {adminLabels.auth.setupHint}
        </p>

        <Link
          href="/"
          className="mt-6 flex items-center justify-center gap-2 text-sm text-content-muted transition-colors hover:text-gold-200"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {adminLabels.auth.backToSite}
        </Link>
      </div>
    </main>
  );
}