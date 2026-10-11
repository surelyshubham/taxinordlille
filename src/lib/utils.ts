import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Turn a title into a URL-safe slug. Keeps French accents as their ASCII
 * equivalent so "Transfert aéroport" -> "transfert-aeroport".
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

/** Interpolate `{name}` placeholders in a dictionary string. */
export function formatMessage(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/** Format a UTC timestamp in the given French/English locale. */
export function formatDate(
  date: Date | string | number,
  tag: string,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  },
): string {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return "—";
  return new Intl.DateTimeFormat(tag, options).format(value);
}

/** `fr-FR` style short date + time, used across the admin panel. */
export function formatDateTime(
  date: Date | string | number,
  tag = "fr-FR",
): string {
  return formatDate(date, tag, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Today's date as `YYYY-MM-DD` in Europe/Paris — used to block past dates in
 * date inputs. `en-CA` produces ISO ordering regardless of the visitor's
 * locale, which is why it is hard-coded rather than parameterised.
 */
export function todayInputValue(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Rough reading time for an article body, in minutes (min 1). */
export function readingMinutes(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").length : 0;
  return Math.max(1, Math.round(words / 210));
}

/** Extract `YYYY-MM-DDTHH:mm` in Europe/Paris from a stored UTC timestamp. */
export function toLocalInputValue(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  // en-CA yields ISO-like YYYY-MM-DD ordering.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/**
 * Interpret a `<input type="datetime-local">` value as Europe/Paris local
 * time and return the equivalent UTC `Date`.
 *
 * A plain `new Date("2026-03-01T08:00")` would be parsed in the server's own
 * timezone, which is wrong for every stored journey time.
 */
export function fromLocalInputValue(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;

  const [, y, mo, d, h, mi] = match;
  // Offset of Europe/Paris at that instant, including DST.
  const utcGuess = Date.UTC(+y, +mo - 1, +d, +h, +mi);
  const offsetMs = parisOffsetMs(new Date(utcGuess));
  return new Date(utcGuess - offsetMs);
}

/** Offset in ms between Europe/Paris and UTC at a given instant. */
function parisOffsetMs(date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );
  return asUtc - date.getTime();
}

/** Escape a value for safe inclusion in CSV output. */
export function csvCell(value: unknown): string {
  const text =
    value === null || value === undefined ? "" : String(value);
  // Neutralise spreadsheet formula injection before quoting.
  const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  if (/["\n\r]/.test(guarded)) {
    return `"${guarded.replace(/"/g, '""')}"`;
  }
  return guarded;
}

/** Join rows into a UTF-8 CSV string with a BOM (Excel-friendly). */
export function toCsv(headers: string[], rows: unknown[][]): string {
  return (
    "﻿" +
    [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")
  );
}