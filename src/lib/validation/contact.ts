import { z } from "zod";

export const CONTACT_SUBJECTS = ["general", "quote", "existing", "other"] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

const optionalEmail = z
  .string()
  .trim()
  .refine((value) => value === "" || z.email().safeParse(value).success);

/**
 * Same convention as the quote schema: no `.default()`, no `z.coerce`, so the
 * input and output types match and the React Hook Form resolver stays clean.
 */
export const contactMessageSchema = z.object({
  fullName: z.string().trim().min(2, "").max(120, ""),
  email: optionalEmail,
  phone: z
    .string()
    .trim()
    .refine((value) => {
      if (value === "") return true;
      if (!/^[0-9+()\s.-]+$/.test(value)) return false;
      const digits = value.replace(/\D/g, "");
      return digits.length >= 7 && digits.length <= 15;
    }, ""),
  subject: z.enum(CONTACT_SUBJECTS),
  message: z.string().trim().min(15, "").max(4000, ""),

  /** Honeypot. */
  website: z.string().max(200, ""),
});

export type ContactMessageValues = z.infer<typeof contactMessageSchema>;

export type ContactErrorKey =
  | "name"
  | "email"
  | "phone"
  | "subject"
  | "message"
  | "messageShort"
  | "generic";

const FIELD_ERROR_MAP: Record<string, ContactErrorKey> = {
  fullName: "name",
  email: "email",
  phone: "phone",
  subject: "subject",
  message: "message",
  website: "generic",
};

export function mapContactIssues(
  error: z.ZodError,
): Record<string, ContactErrorKey> {
  const result: Record<string, ContactErrorKey> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string") continue;

    if (field === "message" && issue.code === "too_small") {
      result[field] = "messageShort";
      continue;
    }

    if (!result[field]) {
      result[field] = FIELD_ERROR_MAP[field] ?? "generic";
    }
  }

  return result;
}

/** Convert a raw `FormData` payload into the shape the schema expects. */
export function normaliseContactInput(
  raw: Record<string, FormDataEntryValue | null>,
): ContactMessageValues {
  const text = (key: string, fallback = ""): string => {
    const value = raw[key];
    return typeof value === "string" ? value : fallback;
  };

  return {
    fullName: text("fullName"),
    email: text("email"),
    phone: text("phone"),
    subject: text("subject", "general") as ContactMessageValues["subject"],
    message: text("message"),
    website: text("website"),
  };
}