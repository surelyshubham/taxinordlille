import type { Metadata } from "next";

/**
 * Admin root layout.
 *
 * Deliberately does **not** enforce authentication: the sign-in screen lives
 * under this layout and must render for anonymous visitors. The guard lives in
 * `(protected)/layout.tsx`, and every Server Action and data query authorises
 * independently — hiding a route is never the security boundary.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}