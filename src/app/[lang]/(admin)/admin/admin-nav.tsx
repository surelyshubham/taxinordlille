"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ExternalLink,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Settings as SettingsIcon,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { adminLabels } from "@/lib/admin/labels";
import { cn } from "@/lib/utils";

import { logoutAction } from "./actions";

const ITEMS = [
  { href: "/admin", label: adminLabels.nav.dashboard, icon: LayoutDashboard, exact: true },
  { href: "/admin/demandes", label: adminLabels.nav.enquiries, icon: Inbox },
  { href: "/admin/messages", label: adminLabels.nav.messages, icon: Mail },
  { href: "/admin/blog", label: adminLabels.nav.blog, icon: FileText },
  { href: "/admin/parametres", label: adminLabels.nav.settings, icon: SettingsIcon },
] as const;

export function AdminNav({
  children,
  email,
  newEnquiryCount,
}: {
  children: React.ReactNode;
  email: string;
  newEnquiryCount: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  // Close the mobile drawer on navigation, adjusting state during render.
  const [lastPath, setLastPath] = React.useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  async function handleLogout() {
    setLoggingOut(true);
    await logoutAction();
    router.replace("/admin/connexion");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="admin-nav"
              aria-label="Menu"
              className="inline-flex size-10 items-center justify-center rounded-lg border border-line-strong text-gold-200 lg:hidden"
            >
              {open ? (
                <X aria-hidden="true" className="size-5" />
              ) : (
                <Menu aria-hidden="true" className="size-5" />
              )}
            </button>

            <span className="font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.2em] text-gold-200">
              {adminLabels.appName}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-content-subtle sm:inline">
              {email}
            </span>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <a href="/" target="_blank" rel="noopener noreferrer">
                {adminLabels.nav.viewSite}
                <ExternalLink aria-hidden="true" />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut aria-hidden="true" />
              <span className="hidden sm:inline">{adminLabels.nav.logout}</span>
            </Button>
          </div>
        </div>

        <nav
          id="admin-nav"
          aria-label={adminLabels.appName}
          className="border-t border-line bg-surface/60 lg:hidden"
          hidden={!open}
        >
          <ul className="px-4 py-2">
            {ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, "exact" in item ? item.exact : false);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors",
                      active
                        ? "bg-gold-400/10 text-gold-200"
                        : "text-content-muted hover:text-gold-200",
                    )}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                    {item.label}
                    {item.href === "/admin/demandes" && newEnquiryCount > 0 ? (
                      <span className="ml-auto rounded-full bg-gold-400 px-2 py-0.5 text-xs font-semibold text-canvas">
                        {newEnquiryCount}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <div className="mx-auto flex max-w-[90rem] gap-8 px-4 py-8 sm:px-6">
        {/* Desktop rail */}
        <nav
          aria-label={adminLabels.appName}
          className="hidden w-60 shrink-0 lg:block"
        >
          <ul className="sticky top-24 space-y-1">
            {ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, "exact" in item ? item.exact : false);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
                      active
                        ? "border-gold-700/60 bg-gold-400/10 text-gold-200"
                        : "border-transparent text-content-muted hover:bg-surface-2 hover:text-gold-200",
                    )}
                  >
                    <Icon aria-hidden="true" className="size-4 shrink-0" />
                    {item.label}
                    {item.href === "/admin/demandes" && newEnquiryCount > 0 ? (
                      <span className="ml-auto rounded-full bg-gold-400 px-2 py-0.5 text-xs font-semibold text-canvas">
                        {newEnquiryCount}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </>
  );
}