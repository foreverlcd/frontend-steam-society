/** Age under which Peruvian law (Ley 29733) needs a parent or guardian's consent. */
export const GUARDIAN_CONSENT_AGE = 14;

/** Whole years between an ISO birth date (YYYY-MM-DD) and `today` (YYYY-MM-DD). */
export function ageOn(birthDate: string, today: string): number | null {
  const birth = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  const now = /^(\d{4})-(\d{2})-(\d{2})$/.exec(today);
  if (!birth || !now) return null;
  const [, by, bm, bd] = birth.map(Number);
  const [, ny, nm, nd] = now.map(Number);
  let age = ny - by;
  if (nm < bm || (nm === bm && nd < bd)) age -= 1;
  return age;
}

export function needsGuardianConsent(
  birthDate: string,
  today: string,
): boolean {
  const age = ageOn(birthDate, today);
  return age !== null && age >= 0 && age < GUARDIAN_CONSENT_AGE;
}
