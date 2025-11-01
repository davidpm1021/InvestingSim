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

