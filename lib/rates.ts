// Hourly rates in AUD, keyed by tier and number of students in the session.
// These are constants — never stored in the database.

export type RateTier = "REGULAR" | "SENIOR";

export const RATES: Record<RateTier, { 1: number; 2: number; 3: number }> = {
  REGULAR: {
    1: 55,  // 1 student, regular
    2: 70,  // 2 students, regular (total for the session)
    3: 90,  // 3-4 students, regular (total for the session)
  },
  SENIOR: {
    1: 80,   // 1 student, senior
    2: 90,   // 2 students, senior (total for the session)
    3: 120,  // 3-4 students, senior (total for the session)
  },
};

/** Returns the hourly rate for a given tier and student count. */
export function getRate(tier: RateTier, studentCount: number): number {
  const tierRates = RATES[tier];
  if (studentCount <= 1) return tierRates[1];
  if (studentCount === 2) return tierRates[2];
  return tierRates[3]; // 3+
}
