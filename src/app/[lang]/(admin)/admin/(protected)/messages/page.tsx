import type { Metadata } from "next";
import { Mail } from "lucide-react";

import { Badge, EmptyState } from "@/components/ui/primitives";
import { getContactMessages } from "@/lib/admin/queries";
import { adminLabels } from "@/lib/admin/labels";
import { formatDateTime } from "@/lib/utils";

import { ContactMessageStatus } from "./message-status";

export const metadata: Metadata = { title: adminLabels.messages.title };

const CONTACT_STATUSES: Record<string, string> = {
  nouveau: "Nouveau",
  traite: "Traité",
  cloture: "Clôturé",
};

export default async function MessagesPage() {
  const messages = await getContactMessages().catch(() => []);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl">{adminLabels.messages.title}</h1>
      </header>

      {messages.length === 0 ? (
        <EmptyState
          icon={<Mail aria-hidden="true" className="size-8" />}
          title={adminLabels.messages.empty}
        />
      ) : (
        <ul className="space-y-4">
          {messages.map((message) => (
            <li key={message.id} className="surface-card rounded-2xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg">{message.subject}</h2>
                    <Badge
                      tone={
                        message.status === "nouveau"
                          ? "gold"
                          : message.status === "traite"
                            ? "info"
                            : "neutral"
                      }
                    >
                      {CONTACT_STATUSES[message.status] ?? message.status}
                    </Badge>
                  </div>

                  <p className="mt-3 text-sm text-content-muted">
                    {message.fullName}
                    {message.email ? ` · ${message.email}` : ""}
                    {message.phone ? ` · ${message.phone}` : ""}
                  </p>

                  <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-content">
                    {message.message}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-3">
                  <time className="whitespace-nowrap text-xs text-content-subtle">
                    {formatDateTime(message.createdAt)}
                  </time>
                  <ContactMessageStatus
                    messageId={message.id}
                    initialStatus={message.status}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}