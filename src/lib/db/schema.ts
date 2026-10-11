import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/* Enums                                                                       */
/* -------------------------------------------------------------------------- */

export const quoteStatusEnum = pgEnum("quote_status", [
  "nouveau",
  "client_contacte",
  "devis_envoye",
  "trajet_confirme",
  "cloture",
]);

export const serviceTypeEnum = pgEnum("service_type", [
  "gare",
  "aeroport",
  "longue_distance",
]);

export const contactStatusEnum = pgEnum("contact_status", [
  "nouveau",
  "traite",
  "cloture",
]);

export const postStatusEnum = pgEnum("post_status", [
  "brouillon",
  "publie",
  "archive",
]);

export const blogLanguageEnum = pgEnum("blog_language", ["fr", "en"]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "email",
  "whatsapp",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "envoye",
  "echec",
  "non_configure",
]);

export const notificationTargetEnum = pgEnum("notification_target", [
  "business",
  "client",
]);

/* -------------------------------------------------------------------------- */
/* Timestamps — every instant is stored in UTC (timestamptz) and rendered in    */
/* Europe/Paris at the UI layer.                                               */
/* -------------------------------------------------------------------------- */

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

/* -------------------------------------------------------------------------- */
/* admin_users                                                                 */
/* -------------------------------------------------------------------------- */

export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    fullName: text("full_name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("owner"),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex("admin_users_email_idx").on(table.email)],
);

/* -------------------------------------------------------------------------- */
/* admin_sessions — server-side sessions; only a SHA-256 hash of the token is   */
/* stored, so a database leak cannot be replayed as a live session.            */
/* -------------------------------------------------------------------------- */

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    userAgent: text("user_agent"),
    ip: text("ip"),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("admin_sessions_token_hash_idx").on(table.tokenHash),
    index("admin_sessions_user_id_idx").on(table.userId),
    index("admin_sessions_expires_at_idx").on(table.expiresAt),
  ],
);

/* -------------------------------------------------------------------------- */
/* rate_limits — fixed-window counters for login throttling and form abuse      */
/* prevention. Kept in the database because the app runs on many short-lived   */
/* serverless instances with no shared memory.                                 */
/* -------------------------------------------------------------------------- */

export const rateLimits = pgTable(
  "rate_limits",
  {
    bucket: text("bucket").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (table) => [
    uniqueIndex("rate_limits_bucket_window_idx").on(table.bucket, table.windowStart),
    index("rate_limits_window_start_idx").on(table.windowStart),
  ],
);

/* -------------------------------------------------------------------------- */
/* quote_requests                                                              */
/* -------------------------------------------------------------------------- */

export const quoteRequests = pgTable(
  "quote_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /** Human-readable reference shown to the customer, e.g. TNL-260311-A7K2. */
    reference: text("reference").notNull(),

    status: quoteStatusEnum("status").notNull().default("nouveau"),
    serviceType: serviceTypeEnum("service_type").notNull(),

    // Customer
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    company: text("company"),
    locale: text("locale").notNull().default("fr"),

    // Journey
    pickupAddress: text("pickup_address").notNull(),
    destinationAddress: text("destination_address").notNull(),
    departureAt: timestamp("departure_at", { withTimezone: true }).notNull(),
    returnAt: timestamp("return_at", { withTimezone: true }),
    passengers: integer("passengers").notNull(),
    flightOrTrainNumber: text("flight_or_train_number"),
    luggageNotes: text("luggage_notes"),
    message: text("message"),
    billingReference: text("billing_reference"),

    // Consent record
    consentGivenAt: timestamp("consent_given_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    consentVersion: text("consent_version").notNull().default("v1"),

    // Internal — never exposed to the public
    adminNotes: text("admin_notes"),
    statusUpdatedAt: timestamp("status_updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("quote_requests_reference_idx").on(table.reference),
    index("quote_requests_status_idx").on(table.status),
    index("quote_requests_created_at_idx").on(table.createdAt),
    index("quote_requests_departure_at_idx").on(table.departureAt),
    index("quote_requests_full_name_idx").on(table.fullName),
    index("quote_requests_phone_idx").on(table.phone),
  ],
);

export const quoteRequestsRelations = relations(quoteRequests, ({ many }) => ({
  notifications: many(notificationLogs),
}));

/* -------------------------------------------------------------------------- */
/* contact_messages                                                            */
/* -------------------------------------------------------------------------- */

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: text("full_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    locale: text("locale").notNull().default("fr"),
    status: contactStatusEnum("status").notNull().default("nouveau"),
    adminNotes: text("admin_notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("contact_messages_status_idx").on(table.status),
    index("contact_messages_created_at_idx").on(table.createdAt),
  ],
);

/* -------------------------------------------------------------------------- */
/* blog_categories                                                             */
/* -------------------------------------------------------------------------- */

export const blogCategories = pgTable(
  "blog_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    nameFr: text("name_fr").notNull(),
    nameEn: text("name_en").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (table) => [uniqueIndex("blog_categories_slug_idx").on(table.slug)],
);

/* -------------------------------------------------------------------------- */
/* blog_posts                                                                  */
/* -------------------------------------------------------------------------- */

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    excerpt: text("excerpt"),
    /** Sanitised HTML — always re-sanitised on write, never trusted on read. */
    content: text("content").notNull().default(""),
    language: blogLanguageEnum("language").notNull().default("fr"),
    status: postStatusEnum("status").notNull().default("brouillon"),

    coverImageUrl: text("cover_image_url"),
    coverImageAlt: text("cover_image_alt"),
    coverImageWidth: integer("cover_image_width"),
    coverImageHeight: integer("cover_image_height"),

    categoryId: uuid("category_id").references(() => blogCategories.id, {
      onDelete: "set null",
    }),
    tags: jsonb("tags").$type<string[]>().notNull().default(sql`'[]'::jsonb`),

    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    authorName: text("author_name"),

    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("blog_posts_slug_idx").on(table.slug),
    // Serves the public listing: published posts for a language, newest first.
    index("blog_posts_public_idx").on(table.language, table.status, table.publishedAt),
    index("blog_posts_status_idx").on(table.status),
    index("blog_posts_category_id_idx").on(table.categoryId),
  ],
);

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  category: one(blogCategories, {
    fields: [blogPosts.categoryId],
    references: [blogCategories.id],
  }),
}));

/* -------------------------------------------------------------------------- */
/* site_settings — single row, structured JSON validated by Zod at every read   */
/* and write. See src/lib/settings/schema.ts.                                  */
/* -------------------------------------------------------------------------- */

export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  data: jsonb("data").notNull(),
  updatedAt: updatedAt(),
});

/* -------------------------------------------------------------------------- */
/* notification_logs                                                           */
/* -------------------------------------------------------------------------- */

export const notificationLogs = pgTable(
  "notification_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quoteRequestId: uuid("quote_request_id").references(() => quoteRequests.id, {
      onDelete: "cascade",
    }),
    contactMessageId: uuid("contact_message_id").references(
      () => contactMessages.id,
      { onDelete: "cascade" },
    ),
    channel: notificationChannelEnum("channel").notNull(),
    target: notificationTargetEnum("target").notNull(),
    status: notificationStatusEnum("status").notNull(),
    /** Who/what the message went to — masked where it is personal data. */
    recipient: text("recipient"),
    providerMessageId: text("provider_message_id"),
    /** Sanitised, truncated failure reason. Never contains credentials. */
    errorDetail: text("error_detail"),
    attempt: integer("attempt").notNull().default(1),
    createdAt: createdAt(),
  },
  (table) => [
    index("notification_logs_quote_request_id_idx").on(table.quoteRequestId),
    index("notification_logs_contact_message_id_idx").on(table.contactMessageId),
    index("notification_logs_status_idx").on(table.status),
    index("notification_logs_created_at_idx").on(table.createdAt),
  ],
);

/* -------------------------------------------------------------------------- */
/* admin_activity — lightweight audit trail for the dashboard                   */
/* -------------------------------------------------------------------------- */

export const adminActivity = pgTable(
  "admin_activity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => adminUsers.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    detail: text("detail"),
    createdAt: createdAt(),
  },
  (table) => [
    index("admin_activity_created_at_idx").on(table.createdAt),
    index("admin_activity_entity_idx").on(table.entityType, table.entityId),
  ],
);

/* -------------------------------------------------------------------------- */
/* Inferred types                                                              */
/* -------------------------------------------------------------------------- */

export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type NewQuoteRequest = typeof quoteRequests.$inferInsert;
export type QuoteStatus = (typeof quoteStatusEnum.enumValues)[number];
export type ServiceType = (typeof serviceTypeEnum.enumValues)[number];

export type ContactMessage = typeof contactMessages.$inferSelect;
export type NewContactMessage = typeof contactMessages.$inferInsert;
export type ContactStatus = (typeof contactStatusEnum.enumValues)[number];

export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;
export type PostStatus = (typeof postStatusEnum.enumValues)[number];
export type BlogLanguage = (typeof blogLanguageEnum.enumValues)[number];

export type BlogCategory = typeof blogCategories.$inferSelect;

export type NotificationChannel =
  (typeof notificationChannelEnum.enumValues)[number];
export type NotificationStatus =
  (typeof notificationStatusEnum.enumValues)[number];
export type NotificationTarget =
  (typeof notificationTargetEnum.enumValues)[number];

export type AdminUser = typeof adminUsers.$inferSelect;
export type SiteSettingsRow = typeof siteSettings.$inferSelect;