import quartersData from './quarters.json';

export interface Quarter {
  label: string;
  value: string;
  startDate: string;
  endDate: string;
  months: string[];
}

export interface QuartersData {
  quarters: Quarter[];
}

export const QUARTERS: QuartersData = quartersData as QuartersData;

/**
 * Single home for the simulation's time constants (per the reuse-first rule).
 * The first playable quarter — interest accrual and YTD windows start here.
 */
export const SIM_YEAR_START = '2025-01-01';

/** The last simulation date (the Year-End Review). */
export const SIM_END = QUARTERS.quarters[QUARTERS.quarters.length - 1].value;

/**
 * Quarter-end dates on which dividends/bond income post: the playable quarters
 * (excludes the Opening period and the single-day Year-End Review).
 */
export const PAYING_QUARTER_ENDS: string[] = QUARTERS.quarters
  .filter(q => q.startDate >= SIM_YEAR_START && q.startDate !== q.endDate)
  .map(q => q.endDate);

/** Is this quarter value the final (Year-End Review) milestone? */
export function isFinalQuarter(quarterValue: string): boolean {
  return quarterValue === SIM_END;
}

/**
 * Get quarter for a given date
 */
export function getQuarterForDate(date: string): Quarter | null {
  const quarter = QUARTERS.quarters.find(q => {
    return date >= q.startDate && date <= q.endDate;
  });
  return quarter || null;
}

/**
 * Get previous quarter
 */
export function getPreviousQuarter(quarterValue: string): Quarter | null {
  const currentIndex = QUARTERS.quarters.findIndex(q => q.value === quarterValue);
  if (currentIndex > 0) {
    return QUARTERS.quarters[currentIndex - 1];
  }
  return null;
}

/**
 * Get all quarter start dates
 */
export function getQuarterStartDates(): string[] {
  return QUARTERS.quarters.map(q => q.value);
}

