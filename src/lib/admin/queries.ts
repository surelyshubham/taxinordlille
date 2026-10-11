import "server-only";

import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  type SQL,
} from "drizzle-orm";

import { getDb } from "@/lib/db";
import {
  blogPosts,
  contactMessages,
  notificationLogs,
  quoteRequests,
  type QuoteRequest,
  type QuoteStatus,
} from "@/lib/db/schema";

export type EnquiryFilters = {
  search?: string;
  status?: string;
  serviceType?: string;
  from?: string;
  to?: string;
  page?: number;
};

export type EnquiryRow = QuoteRequest & {
  emailStatus: string | null;
  whatsappStatus: string | null;
};

const PER_PAGE = 20;

export const VALID_STATUSES: QuoteStatus[] = [
  "nouveau",
  "client_contacte",
  "devis_envoye",
  "trajet_confirme",
  "cloture",
];

function buildWhere(filters: EnquiryFilters): SQL | undefined {
  const conditions: (SQL | undefined)[] = [];

  if (filters.status && filters.status !== "all") {
    conditions.push(eq(quoteRequests.status, filters.status as QuoteStatus));
  }

  if (filters.serviceType && filters.serviceType !== "all") {
    conditions.push(
      eq(quoteRequests.serviceType, filters.serviceType as never),
    );
  }

  // Inclusive day bounds, expressed in UTC to match how rows are stored.
  if (filters.from) {
    const from = new Date(`${filters.from}T00:00:00.000Z`);
    if (!Number.isNaN(from.getTime())) {
      conditions.push(gte(quoteRequests.createdAt, from));
    }
  }
  if (filters.to) {
    const to = new Date(`${filters.to}T23:59:59.999Z`);
    if (!Number.isNaN(to.getTime())) {
      conditions.push(lte(quoteRequests.createdAt, to));
    }
  }

  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        ilike(quoteRequests.fullName, term),
        ilike(quoteRequests.phone, term),
        ilike(quoteRequests.reference, term),
        ilike(quoteRequests.email, term),
        ilike(quoteRequests.pickupAddress, term),
        ilike(quoteRequests.destinationAddress, term),
      ),
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/** Enquiries matching the active filters, plus the total for pagination. */
export async function getEnquiries(filters: EnquiryFilters): Promise<{
  rows: EnquiryRow[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const where = buildWhere(filters);
  const page = Math.max(1, filters.page ?? 1);
  const offset = (page - 1) * PER_PAGE;

  // Latest email / WhatsApp outcome per enquiry, for the status column.
  const [totalRows, rows] = await Promise.all([
    getDb().select({ value: count() }).from(quoteRequests).where(where),
    getDb()
      .select()
      .from(quoteRequests)
      .where(where)
      .orderBy(desc(quoteRequests.createdAt))
      .limit(PER_PAGE)
      .offset(offset),
  ]);

  const ids = rows.map((row) => row.id);
  const logs = ids.length
    ? await getDb()
        .select({
          quoteRequestId: notificationLogs.quoteRequestId,
          channel: notificationLogs.channel,
          status: notificationLogs.status,
        })
        .from(notificationLogs)
        .where(inArray(notificationLogs.quoteRequestId, ids))
        .orderBy(desc(notificationLogs.createdAt))
    : [];

  const latest = new Map<string, { email?: string; whatsapp?: string }>();
  for (const log of logs) {
    if (!log.quoteRequestId) continue;
    const bucket = latest.get(log.quoteRequestId) ?? {};
    if (log.channel === "email" && !bucket.email) bucket.email = log.status;
    if (log.channel === "whatsapp" && !bucket.whatsapp) {
      bucket.whatsapp = log.status;
    }
    latest.set(log.quoteRequestId, bucket);
  }

  const total = totalRows[0]?.value ?? 0;

  return {
    rows: rows.map((row) => {
      const bucket = latest.get(row.id) ?? {};
      return {
        ...row,
        emailStatus: bucket.email ?? null,
        whatsappStatus: bucket.whatsapp ?? null,
      };
    }),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PER_PAGE)),
  };
}

/** Full detail for one enquiry, including its notification history. */
export async function getEnquiryById(id: string): Promise<{
  enquiry: QuoteRequest | null;
  notifications: typeof notificationLogs.$inferSelect[];
}> {
  const rows = await getDb()
    .select()
    .from(quoteRequests)
    .where(eq(quoteRequests.id, id))
    .limit(1);

  const enquiry = rows[0] ?? null;
  if (!enquiry) return { enquiry: null, notifications: [] };

  const notifications = await getDb()
    .select()
    .from(notificationLogs)
    .where(eq(notificationLogs.quoteRequestId, id))
    .orderBy(desc(notificationLogs.createdAt))
    .limit(50);

  return { enquiry, notifications };
}

/** All rows matching the current filters, for CSV export. */
export async function getEnquiriesForExport(
  filters: EnquiryFilters,
): Promise<QuoteRequest[]> {
  return getDb()
    .select()
    .from(quoteRequests)
    .where(buildWhere(filters))
    .orderBy(desc(quoteRequests.createdAt))
    .limit(5000);
}

/* -------------------------------------------------------------------------- */
/* Dashboard aggregates                                                        */
/* -------------------------------------------------------------------------- */

export type DashboardStats = {
  totalEnquiries: number;
  byStatus: Record<string, number>;
  newEnquiries: number;
  inProgress: number;
  confirmed: number;
  closed: number;
  totalMessages: number;
  newMessages: number;
  publishedPosts: number;
  draftPosts: number;
  recent: QuoteRequest[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    totalRows,
    statusRows,
    messageRows,
    newMessageRows,
    publishedRows,
    draftRows,
    recent,
  ] = await Promise.all([
    getDb().select({ value: count() }).from(quoteRequests),
    getDb()
      .select({ status: quoteRequests.status, value: count() })
      .from(quoteRequests)
      .groupBy(quoteRequests.status),
    getDb().select({ value: count() }).from(contactMessages),
    getDb()
      .select({ value: count() })
      .from(contactMessages)
      .where(eq(contactMessages.status, "nouveau")),
    getDb()
      .select({ value: count() })
      .from(blogPosts)
      .where(eq(blogPosts.status, "publie")),
    getDb()
      .select({ value: count() })
      .from(blogPosts)
      .where(eq(blogPosts.status, "brouillon")),
    getDb()
      .select()
      .from(quoteRequests)
      .orderBy(desc(quoteRequests.createdAt))
      .limit(6),
  ]);

  const byStatus: Record<string, number> = {};
  for (const row of statusRows) byStatus[row.status] = Number(row.value);

  const sum = (...keys: string[]) =>
    keys.reduce((total, key) => total + (byStatus[key] ?? 0), 0);

  return {
    totalEnquiries: totalRows[0]?.value ?? 0,
    byStatus,
    newEnquiries: byStatus.nouveau ?? 0,
    inProgress: sum("client_contacte", "devis_envoye"),
    confirmed: sum("trajet_confirme"),
    closed: byStatus.cloture ?? 0,
    totalMessages: messageRows[0]?.value ?? 0,
    newMessages: newMessageRows[0]?.value ?? 0,
    publishedPosts: publishedRows[0]?.value ?? 0,
    draftPosts: draftRows[0]?.value ?? 0,
    recent,
  };
}

/** Contact messages, newest first. */
export async function getContactMessages(limit = 100) {
  return getDb()
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt))
    .limit(limit);
}