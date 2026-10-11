import { count, eq } from "drizzle-orm";
import Link from "next/link";

import { getDb } from "@/lib/db";
import { quoteRequests } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { getUnconfirmedFields } from "@/lib/settings/schema";
import { getSiteSettings } from "@/lib/settings";

import { AdminNav } from "../admin-nav";

/**
 * Guarded admin shell.
 *
 * `requireAdmin()` redirects anonymous visitors to the sign-in screen, but the
 * real protection lives one level down: every Server Action calls
 * `requireAdminAction()` and every query in these pages runs only after this
 * check. Proxy is deliberately not involved — it may run at the edge, where a
 * database lookup is neither available nor appropriate.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  const settings = await getSiteSettings();
  const unconfirmed = getUnconfirmedFields(settings);

  const [newRows] = await getDb()
    .select({ value: count() })
    .from(quoteRequests)
    .where(eq(quoteRequests.status, "nouveau"));

  return (
    <>
      {unconfirmed.length > 0 ? (
        <div className="border-b border-warning/35 bg-warning/[0.08] px-4 py-3 text-center text-xs text-[#e8bf80] sm:px-6">
          {unconfirmed.length} champ(s) de configuration utilisent encore une
          valeur par défaut — voir{" "}
          <Link href="/admin/parametres" className="underline underline-offset-4">
            Paramètres
          </Link>
          .
        </div>
      ) : null}

      <AdminNav email={user.email} newEnquiryCount={newRows?.value ?? 0}>
        {children}
      </AdminNav>
    </>
  );
}