"use client";

import * as React from "react";

/**
 * The minimal slice of site settings that client components need.
 *
 * Deliberately a plain object of primitives: passing the whole validated
 * settings tree into the client bundle would ship configuration the browser
 * has no business holding.
 */
export type SiteContact = {
  businessName: string;
  phone: string;
  phoneDisplay: string;
  whatsappNumber: string;
  email: string;
};

const SiteContactContext = React.createContext<SiteContact | null>(null);

export function SiteContactProvider({
  value,
  children,
}: {
  value: SiteContact;
  children: React.ReactNode;
}) {
  return (
    <SiteContactContext.Provider value={value}>
      {children}
    </SiteContactContext.Provider>
  );
}

export function useSiteContact(): SiteContact {
  const context = React.useContext(SiteContactContext);
  if (!context) {
    throw new Error("useSiteContact must be used inside <SiteContactProvider>.");
  }
  return context;
}