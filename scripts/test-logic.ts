/**
 * Smoke tests for the pure business logic.
 *
 * These cover the parts of the enquiry workflow that do not require a live
 * database: field validation, Paris-timezone date handling, HTML
 * sanitisation, slug generation and CSV safety.
 *
 *   npx tsx scripts/test-logic.ts
 */
import {
  mapQuoteIssues,
  normaliseQuoteInput,
  quoteRequestSchema,
  toStoredDates,
} from "../src/lib/validation/quote";
import {
  contactMessageSchema,
  mapContactIssues,
  normaliseContactInput,
} from "../src/lib/validation/contact";
import {
  extractHeadings,
  htmlToText,
  injectHeadingIds,
  sanitizeArticleHtml,
} from "../src/lib/sanitize";
import { csvCell, formatDateTime, fromLocalInputValue, slugify, toCsv } from "../src/lib/utils";
import { localizedHref } from "../src/lib/i18n/config";

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean, detail?: unknown) {
  if (condition) {
    passed += 1;
    console.log(`  ok   ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL ${label}`, detail === undefined ? "" : detail);
  }
}

const validQuote = {
  fullName: "Marie Dupont",
  phone: "06 12 34 56 78",
  email: "marie@example.fr",
  serviceType: "gare" as const,
  pickupAddress: "Gare Lille-Flandres",
  destinationAddress: "12 rue Nationale, Lille",
  departureDate: "2099-01-15",
  departureTime: "09:30",
  returnJourney: false,
  returnDate: "",
  returnTime: "",
  passengers: 2,
  flightOrTrainNumber: "",
  luggageNotes: "",
  message: "",
  company: "",
  billingReference: "",
  consent: true,
  website: "",
};

console.log("\nquote schema");
{
  const ok = quoteRequestSchema.safeParse(validQuote);
  check("valid payload accepted", ok.success, ok.success ? "" : ok.error.issues);

  const past = { ...validQuote, departureDate: "2020-01-01" };
  const pastResult = quoteRequestSchema.safeParse(past);
  check(
    "past departure rejected",
    !pastResult.success && mapQuoteIssues(pastResult.error!).departureDate === "departureDatePast",
  );

  const shortPhone = quoteRequestSchema.safeParse({ ...validQuote, phone: "123" });
  check(
    "short phone rejected with phoneShort",
    !shortPhone.success &&
      mapQuoteIssues(shortPhone.error!).phone === "phoneShort",
  );

  const badEmail = quoteRequestSchema.safeParse({ ...validQuote, email: "nope" });
  check(
    "invalid email rejected",
    !badEmail.success && mapQuoteIssues(badEmail.error!).email === "email",
  );

  const noConsent = quoteRequestSchema.safeParse({ ...validQuote, consent: false });
  check(
    "missing consent rejected",
    !noConsent.success && mapQuoteIssues(noConsent.error!).consent === "consent",
  );

  const same = quoteRequestSchema.safeParse({
    ...validQuote,
    destinationAddress: "GARE LILLE-FLANDRES",
  });
  check(
    "identical addresses rejected (case/space insensitive)",
    !same.success && mapQuoteIssues(same.error!).addressSame === "addressSame",
  );

  const backToBack = quoteRequestSchema.safeParse({
    ...validQuote,
    returnJourney: true,
    returnDate: validQuote.departureDate,
    returnTime: "08:00",
  });
  check(
    "return before departure rejected",
    !backToBack.success &&
      mapQuoteIssues(backToBack.error!).returnBeforeDeparture === "returnBeforeDeparture",
  );

  const validReturn = quoteRequestSchema.safeParse({
    ...validQuote,
    returnJourney: true,
    returnDate: "2099-01-15",
    returnTime: "18:00",
  });
  check("return after departure accepted", validReturn.success);
}

console.log("\nFormData normalisation");
{
  const normalised = normaliseQuoteInput({
    fullName: "Jean",
    phone: "0612345678",
    serviceType: "aeroport",
    passengers: "4",
    consent: "true",
    returnJourney: "false",
  });
  check("passengers coerced to number", normalised.passengers === 4);
  check("consent coerced to boolean", normalised.consent === true);
  check("absent checkbox is false", normalised.returnJourney === false);
  check("optional strings default to empty", normalised.email === "");
}

console.log("\nParis timezone conversion");
{
  // 15 January is CET (UTC+1): 09:30 Paris == 08:30 UTC.
  const winter = fromLocalInputValue("2099-01-15T09:30");
  check(
    "winter (CET) 09:30 Paris -> 08:30 UTC",
    winter?.toISOString() === "2099-01-15T08:30:00.000Z",
    winter?.toISOString(),
  );

  // 15 July is CEST (UTC+2): 09:30 Paris == 07:30 UTC.
  const summer = fromLocalInputValue("2099-07-15T09:30");
  check(
    "summer (CEST) 09:30 Paris -> 07:30 UTC",
    summer?.toISOString() === "2099-07-15T07:30:00.000Z",
    summer?.toISOString(),
  );

  const { departureAt } = toStoredDates(validQuote);
  check(
    "journey departure stored as UTC",
    departureAt?.toISOString() === "2099-01-15T08:30:00.000Z",
    departureAt?.toISOString(),
  );
}

console.log("\ndisplay timezone (must be Europe/Paris, not the host's)");
{
  // 08:30 UTC in January is 09:30 in Paris (CET). On a machine set to UTC or
  // to UTC+05:30 this would otherwise render as 08:30 or 14:00.
  const winter = formatDateTime("2099-01-15T08:30:00.000Z", "fr-FR");
  check("winter renders as 09:30 Paris", winter.includes("09:30"), winter);

  // In July Paris is on CEST (UTC+2), so the same instant is 10:30.
  const summer = formatDateTime("2099-07-15T08:30:00.000Z", "fr-FR");
  check("summer renders as 10:30 Paris", summer.includes("10:30"), summer);

  check(
    "host timezone does not leak",
    !winter.includes("14:00") && !winter.includes("08:30"),
    winter,
  );
}

console.log("\ncontact schema");
{
  const ok = contactMessageSchema.safeParse(
    normaliseContactInput({
      fullName: "Paul",
      email: "paul@example.fr",
      phone: "",
      subject: "general",
      message: "Bonjour, une question sur un transfert.",
    }),
  );
  check("valid contact accepted (phone optional)", ok.success);

  const short = contactMessageSchema.safeParse(
    normaliseContactInput({
      fullName: "Paul",
      subject: "general",
      message: "trop court",
    }),
  );
  check(
    "short message rejected",
    !short.success && mapContactIssues(short.error!).message === "messageShort",
  );
}

console.log("\nHTML sanitisation");
{
  const dirty = `
    <h2>Bonjour</h2>
    <p onclick="steal()">Texte <strong>gras</strong> et <script>alert(1)</script>piège.</p>
    <a href="javascript:alert(1)">mauvais lien</a>
    <a href="https://example.fr" target="_blank">bon lien</a>
    <img src="x" onerror="alert(1)">
  `;
  const clean = sanitizeArticleHtml(dirty);

  check("script tag removed", !clean.includes("<script"), clean);
  check("event handler removed", !clean.includes("onclick"), clean);
  check("onerror removed", !clean.includes("onerror"), clean);
  check("javascript: href removed", !clean.includes("javascript:"), clean);
  check(
    "target=_blank gets rel=noopener",
    clean.includes('rel="noopener noreferrer"'),
    clean,
  );
  check("legitimate markup survives", clean.includes("<strong>gras</strong>"));

  const text = htmlToText(clean);
  check("html stripped to text", !text.includes("<"), text.slice(0, 60));
}

console.log("\nheading anchors");
{
  const html = "<h2>Premier titre</h2><p>x</p><h3>Sous-titre</h3><h2>Premier titre</h2>";
  const anchored = injectHeadingIds(html);
  const headings = extractHeadings(anchored);

  check("three headings extracted", headings.length === 3, headings.length);
  check("first heading id", headings[0]?.id === "premier-titre", headings[0]?.id);
  check("duplicate heading gets unique id", headings[2]?.id === "premier-titre-2", headings[2]?.id);
  check("h3 level recorded", headings[1]?.level === 3);
  check("anchors present in html", anchored.includes('id="premier-titre"'));
}

console.log("\nslugs and CSV");
{
  check("accents transliterated", slugify("Transfert aéroport") === "transfert-aeroport");
  check("punctuation stripped", slugify("Gares - Aéroports !") === "gares-aeroports");
  check("empty-ish input", slugify("   ") === "");

  check(
    "csv neutralises formula injection",
    csvCell("=cmd|'/c calc'!A1").startsWith("'"),
    csvCell("=cmd|'/c calc'!A1"),
  );
  check("csv quotes embedded quotes", csvCell('a"b') === '"a""b"');
  const csv = toCsv(["a", "b"], [[1, 2]]);
  check("csv has BOM", csv.charCodeAt(0) === 0xfeff);
}

console.log("\nlocale URLs");
{
  check("french is unprefixed", localizedHref("fr", "/services") === "/services");
  check("french root", localizedHref("fr", "/") === "/");
  check("english is prefixed", localizedHref("en", "/services") === "/en/services");
  check("english root", localizedHref("en", "/") === "/en");
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);