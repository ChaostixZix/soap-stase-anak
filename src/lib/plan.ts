import { format, parse } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { PlanItem, CreatePlanItem } from './db.js';

const JAKARTA_TIMEZONE = 'Asia/Jakarta';

export interface ParsedMedication {
  drug: string;
  route?: string;
  dose?: string;
  freq?: string;
  days?: number;
  start_date?: string;
}

/**
 * Get current date in Jakarta timezone as YYYY-MM-DD string
 */
export function getTodayInJakarta(): string {
  const now = toZonedTime(new Date(), JAKARTA_TIMEZONE);
  return format(now, 'yyyy-MM-dd');
}

/**
 * Parse Indonesian medication text into structured format
 * Supports inputs like:
 * - "Inj. Cefotaxime 1g IV q8h 2 hari"
 * - "Inf. Paracetamol 1g PO bid 2 hari mulai 26 Aug"
 * - "Cefotaxime untuk 3 hari"
 */
export function parseMedication(text: string): ParsedMedication {
  const cleaned = text.trim();
  
  // Initialize result
  const result: ParsedMedication = {
    drug: '',
  };

  // Extract start date if present (e.g., "mulai 26 Aug", "mulai 2023-08-26")
  const startDateMatch = cleaned.match(/mulai\s+((\d{1,2})\s+(jan|feb|mar|apr|may|mei|jun|jul|aug|agu|sep|oct|okt|nov|dec|des)|(\d{4}-\d{2}-\d{2}))/i);
  if (startDateMatch) {
    if (startDateMatch[4]) {
      // ISO format
      result.start_date = startDateMatch[4];
    } else {
      // Day + month format - convert to current year
      const day = startDateMatch[2];
      const monthStr = startDateMatch[3].toLowerCase();
      const monthMap: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, mei: 4,
        jun: 5, jul: 6, aug: 7, agu: 7, sep: 8,
        oct: 9, okt: 9, nov: 10, dec: 11, des: 11
      };
      const month = monthMap[monthStr];
      if (month !== undefined) {
        const year = new Date().getFullYear();
        const date = new Date(year, month, parseInt(day));
        result.start_date = format(date, 'yyyy-MM-dd');
      }
    }
  }

  // Extract days (e.g., "2 hari", "3 hari")
  const daysMatch = cleaned.match(/(\d+)\s*hari/i);
  if (daysMatch) {
    result.days = parseInt(daysMatch[1]);
  }

  // Remove temporal information for further parsing
  let medicationText = cleaned
    .replace(/mulai\s+[\w\s-]+/i, '')
    .replace(/\d+\s*hari/i, '')
    .replace(/untuk\s*/i, '')
    .trim();

  // Extract frequency (e.g., "q8h", "bid", "tid", "qid")
  const freqMatch = medicationText.match(/(q\d+h|bid|tid|qid|od|once daily|twice daily|three times daily|setiap \d+ jam)/i);
  if (freqMatch) {
    result.freq = freqMatch[1];
    medicationText = medicationText.replace(freqMatch[0], '').trim();
  }

  // Extract route (e.g., "IV", "PO", "IM", "SC")
  const routeMatch = medicationText.match(/(IV|PO|IM|SC|oral|intravenous|intramuscular|subcutaneous)/i);
  if (routeMatch) {
    result.route = routeMatch[1].toUpperCase();
    medicationText = medicationText.replace(routeMatch[0], '').trim();
  }

  // Extract dose (e.g., "1g", "500mg", "0.5ml")
  const doseMatch = medicationText.match(/(\d+(?:\.\d+)?(?:g|mg|ml|mcg|units?|iu|tablet|caps?))/i);
  if (doseMatch) {
    result.dose = doseMatch[1];
    medicationText = medicationText.replace(doseMatch[0], '').trim();
  }

  // Extract drug name (remaining text after removing route, dose, frequency)
  // Remove common prefixes like "Inj.", "Inf.", "Tab."
  const drugName = medicationText
    .replace(/^(inj\.|inf\.|tab\.|caps?\.|syr\.)\s*/i, '')
    .trim();

  if (drugName) {
    result.drug = drugName;
  } else {
    // Fallback: use the original text if we can't parse the drug name
    result.drug = text.trim();
  }

  return result;
}

/**
 * Compute end date based on start date and days
 */
export function computeEndDate(startDate: string, days?: number): string {
  if (!days || days <= 0) {
    return startDate;
  }
  
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(start.getDate() + days - 1); // Inclusive end date
  return format(end, 'yyyy-MM-dd');
}

/**
 * Split plan items into active and done based on current date
 */
export function splitActiveDone(items: PlanItem[], today?: string): { plan_active: PlanItem[]; plan_done: PlanItem[] } {
  const todayStr = today || getTodayInJakarta();
  const todayDate = new Date(todayStr);
  
  const plan_active: PlanItem[] = [];
  const plan_done: PlanItem[] = [];
  
  items.forEach(item => {
    const endDate = new Date(item.end_date);
    if (endDate >= todayDate) {
      plan_active.push({ ...item, status: 'active' });
    } else {
      plan_done.push({ ...item, status: 'done' });
    }
  });
  
  return { plan_active, plan_done };
}

/**
 * Process create plan items to full plan items with computed dates and status
 */
export function processPlanItems(planItems: CreatePlanItem[]): PlanItem[] {
  const todayStr = getTodayInJakarta();

  return planItems.map(item => {
    const startDate = item.start_date || todayStr;
    
    // Calculate end_date based on start_date + days
    let endDate = startDate;
    if (item.days && item.days > 0) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + item.days - 1); // days - 1 because it's inclusive
      endDate = format(end, 'yyyy-MM-dd');
    }

    // Determine status based on end_date vs today
    const status = new Date(endDate) >= new Date(todayStr) ? 'active' : 'done';

    return {
      drug: item.drug,
      route: item.route,
      dose: item.dose,
      freq: item.freq,
      days: item.days,
      start_date: startDate,
      end_date: endDate,
      status
    };
  });
}

/**
 * Recompute statuses for existing plan items based on current date
 */
export function recomputePlanStatuses(planItems: PlanItem[]): PlanItem[] {
  const todayStr = getTodayInJakarta();

  return planItems.map(item => ({
    ...item,
    status: new Date(item.end_date) >= new Date(todayStr) ? 'active' : 'done'
  }));
}

/**
 * Add new plan items to existing plan and recompute all statuses
 */
export function addPlanItems(existingPlan: PlanItem[], newItems: CreatePlanItem[]): PlanItem[] {
  const processedNewItems = processPlanItems(newItems);
  const updatedExistingItems = recomputePlanStatuses(existingPlan);
  
  return [...updatedExistingItems, ...processedNewItems];
}

/**
 * Split plan items into active and done categories
 */
export function splitPlanItems(planItems: PlanItem[]): { active: PlanItem[]; done: PlanItem[] } {
  const active = planItems.filter(item => item.status === 'active');
  const done = planItems.filter(item => item.status === 'done');
  
  return { active, done };
}

/**
 * Format plan items for display
 */
export function formatPlanItemForDisplay(item: PlanItem): string {
  const parts: string[] = [];
  
  // Drug name
  parts.push(item.drug);
  
  // Dose
  if (item.dose) {
    parts.push(item.dose);
  }
  
  // Route
  if (item.route) {
    parts.push(item.route);
  }
  
  // Frequency
  if (item.freq) {
    parts.push(item.freq);
  }
  
  // Duration info
  if (item.days) {
    const endDate = format(new Date(item.end_date), 'dd MMM');
    if (item.status === 'active') {
      parts.push(`(${item.days} hari, sampai ${endDate})`);
    } else {
      parts.push(`(${item.days} hari, selesai ${endDate})`);
    }
  }
  
  return parts.join(' ');
}

/**
 * Generate formatted plan summary for display
 */
export function generatePlanSummary(planItems: PlanItem[]): string {
  const { active, done } = splitPlanItems(planItems);
  
  const lines: string[] = [];
  
  if (active.length > 0) {
    lines.push('Plan Aktif');
    active.forEach(item => {
      lines.push(`- ${formatPlanItemForDisplay(item)}`);
    });
  }
  
  if (done.length > 0) {
    if (active.length > 0) {
      lines.push('');
      lines.push('---- Plan Selesai');
    } else {
      lines.push('Plan Selesai');
    }
    done.forEach(item => {
      lines.push(`- ${formatPlanItemForDisplay(item)}`);
    });
  }
  
  if (active.length === 0 && done.length === 0) {
    lines.push('Tidak ada plan');
  }
  
  return lines.join('\n');
}