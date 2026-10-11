/**
 * Database seeding.
 *
 * Creates the administrator account (the only way one can exist — there is no
 * public registration anywhere in the application), installs a small set of
 * default blog categories, and writes the initial site settings row.
 *
 * Usage:
 *   npm run seed:admin
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run seed:admin
 *
 * The password is read from the environment, never from a command-line
 * argument, so it does not end up in shell history or process listings.
 */
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { hash } from "bcryptjs";

import * as schema from "../src/lib/db/schema";

const {
  adminUsers,
  blogCategories,
  siteSettings,
} = schema;

const DEFAULT_CATEGORIES = [
  { slug: "gares", nameFr: "Gares", nameEn: "Stations", sortOrder: 10 },
  { slug: "aeroports", nameFr: "Aéroports", nameEn: "Airports", sortOrder: 20 },
  {
    slug: "longue-distance",
    nameFr: "Longue distance",
    nameEn: "Long distance",
    sortOrder: 30,
  },
  { slug: "conseils", nameFr: "Conseils", nameEn: "Tips", sortOrder: 40 },
];

const DEFAULT_SETTINGS = {
  businessName: "Taxi Nord Lille",
  tagline: "Transferts gare, aéroport et longue distance",
  phone: "+33 3 20 00 00 00",
  phoneDisplay: "03 20 00 00 00",
  whatsappNumber: "33320000000",
  email: "contact@taxinordlille.fr",
  address: { street: "", postalCode: "", city: "Lille", country: "France" },
  coverageArea: "Lille et son agglomération",
  openingHours: "",
  social: { facebook: "", instagram: "", linkedin: "", x: "" },
  seo: {
    defaultTitle: "Taxi à Lille — Transferts gare, aéroport et longue distance",
    defaultDescription:
      "Taxi à Lille : transferts gare, aéroport Lille-Lesquin et longues distances. Décrivez votre trajet et recevez un devis personnalisé.",
    ogImageUrl: "/brand/og-default.png",
    city: "Lille",
    postalCode: "59000",
    countryCode: "FR",
    latitude: "",
    longitude: "",
  },
  legal: {
    legalName: "",
    siret: "",
    rcs: "",
    vatNumber: "",
    insuranceInsurer: "",
    hostingProvider: "",
    dataRetentionMonths: 24,
  },
  notifications: {
    emailTo: "contact@taxinordlille.fr",
    emailFrom: "",
    sendCustomerAcknowledgement: true,
    whatsappRecipient: "",
  },
};

function checkPasswordStrength(password: string): string | null {
  if (password.length < 12) {
    return "Le mot de passe doit contenir au moins 12 caractères.";
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    return "Le mot de passe doit contenir une minuscule et une majuscule.";
  }
  if (!/\d/.test(password)) {
    return "Le mot de passe doit contenir au moins un chiffre.";
  }
  return null;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error(
      "DATABASE_URL is not set.\n" +
        "Copy .env.example to .env.local and add your Neon connection string.",
    );
    process.exit(1);
  }

  const pool = new Pool({ connectionString, max: 1 });
  const db = drizzle({ client: pool, schema, casing: "snake_case" });

  // --- Admin account ---
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const fullName = (process.env.ADMIN_NAME ?? "Administrateur").trim();

  if (!email || !password) {
    console.error(
      "ADMIN_EMAIL and ADMIN_PASSWORD are required.\n" +
        "Example:\n" +
        "  ADMIN_EMAIL=owner@example.com ADMIN_PASSWORD='a-strong-password' npm run seed:admin",
    );
    process.exit(1);
  }

  const strength = checkPasswordStrength(password);
  if (strength) {
    console.error(`Mot de passe trop faible : ${strength}`);
    process.exit(1);
  }

  const passwordHash = await hash(password, 12);
  const existing = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(adminUsers)
      .set({ passwordHash, fullName, isActive: true, updatedAt: new Date() })
      .where(eq(adminUsers.id, existing[0].id));
    console.log(`✓ Mot de passe mis à jour pour ${email}`);
  } else {
    await db.insert(adminUsers).values({
      email,
      fullName,
      passwordHash,
      role: "owner",
    });
    console.log(`✓ Administrateur créé : ${email}`);
  }

  // --- Default categories ---
  let created = 0;
  for (const category of DEFAULT_CATEGORIES) {
    const found = await db
      .select({ id: blogCategories.id })
      .from(blogCategories)
      .where(eq(blogCategories.slug, category.slug))
      .limit(1);
    if (found.length === 0) {
      await db.insert(blogCategories).values(category);
      created += 1;
    }
  }
  console.log(`✓ Catégories : ${created} créée(s), ${DEFAULT_CATEGORIES.length - created} déjà présente(s)`);

  // --- Settings row ---
  await db
    .insert(siteSettings)
    .values({ id: 1, data: DEFAULT_SETTINGS })
    .onConflictDoNothing({ target: siteSettings.id });
  console.log("✓ Paramètres du site initialisés");

  console.log("\nTerminé. Connectez-vous sur /admin/connexion");
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
