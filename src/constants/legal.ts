/**
 * Version of the terms and the privacy policy currently published.
 *
 * Bump this whenever either document changes in a way users have to be told
 * about. The consent prompt compares it against what each account last
 * accepted, so it doubles as the version identifier — keep it sortable.
 */
export const LEGAL_VERSION = "2026-10-02";

/** The same date, written the way it is displayed on the legal pages. */
export const LEGAL_LAST_UPDATED = "2 de octubre de 2026";

/**
 * Acceptance is recorded as one entry in the user's `seen_features` array,
 * which avoids a schema change. The shape is
 * `legal_accepted:<version>:<ISO timestamp>` — the version so a new document
 * re-prompts everyone, and the timestamp so we can answer "when did this person
 * accept, and to what" without a separate audit table.
 *
 * Colons separate the parts: the version is a date and the timestamp is ISO, so
 * splitting on the first two colons is unambiguous.
 */
const CONSENT_PREFIX = "legal_accepted";

/** The entry to store for an acceptance happening now. */
export function buildLegalConsentEntry(at: Date = new Date()): string {
  return `${CONSENT_PREFIX}:${LEGAL_VERSION}:${at.toISOString()}`;
}

/** Whether these `seen_features` contain an acceptance of the current version. */
export function hasAcceptedCurrentLegal(
  features: string[] | undefined,
): boolean {
  if (!features) return false;
  return features.some((f) =>
    f.startsWith(`${CONSENT_PREFIX}:${LEGAL_VERSION}:`),
  );
}

/** When this user accepted the current version, or null if they have not. */
export function legalAcceptedAt(features: string[] | undefined): Date | null {
  const entry = features?.find((f) =>
    f.startsWith(`${CONSENT_PREFIX}:${LEGAL_VERSION}:`),
  );
  if (!entry) return null;

  // Everything after `prefix:version:` is the timestamp.
  const timestamp = entry.slice(`${CONSENT_PREFIX}:${LEGAL_VERSION}:`.length);
  const parsed = new Date(timestamp);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
