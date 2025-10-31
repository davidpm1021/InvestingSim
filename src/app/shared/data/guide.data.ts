import guideData from './guide.json';

export interface GuideSection {
  h2: string;
  paragraphs: string[];
}

export interface GuideContent {
  heading: string;
  sections: GuideSection[];
}

export interface Guide {
  default: GuideContent;
  quarter: {
    [date: string]: GuideContent;
  };
}

export const GUIDE: Guide = guideData as Guide;

/**
 * Get guide content for a specific quarter date
 * Returns quarter-specific content if available, otherwise returns default
 */
export function getGuideForQuarter(date: string): GuideContent {
  const guide = GUIDE;
  
  // Check if there's quarter-specific content for this date
  if (guide.quarter[date]) {
    return guide.quarter[date];
  }
  
  // Return default content
  return guide.default;
}

