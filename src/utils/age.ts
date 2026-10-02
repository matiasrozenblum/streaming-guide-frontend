import type { Dayjs } from "dayjs";

/** Matches the server-side rule in the backend's `is-adult.validator`. */
export const MINIMUM_AGE_YEARS = 18;

export const MINIMUM_AGE_MESSAGE = `Debés ser mayor de ${MINIMUM_AGE_YEARS} años para registrarte`;
export const BIRTH_DATE_REQUIRED_MESSAGE =
  "La fecha de nacimiento es obligatoria";

/** Completed years between `birthDate` and today. */
export function calculateAge(birthDate: Date | Dayjs): number {
  const birth = "toDate" in birthDate ? birthDate.toDate() : birthDate;
  const now = new Date();

  let age = now.getFullYear() - birth.getFullYear();
  // Subtract a year when the birthday has not come round yet this year.
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * The error to show for a birth date field, or null when it is acceptable.
 *
 * Every signup surface validates the same way through this, so the forms can't
 * drift apart from each other or from the server rule. Returning the message
 * rather than a boolean keeps the copy in one place too.
 */
export function birthDateError(birthDate: Date | Dayjs | null): string | null {
  if (!birthDate) return BIRTH_DATE_REQUIRED_MESSAGE;
  return calculateAge(birthDate) < MINIMUM_AGE_YEARS
    ? MINIMUM_AGE_MESSAGE
    : null;
}
