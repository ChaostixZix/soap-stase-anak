import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { PlanItem, CreatePlanItem } from './db.js';

const JAKARTA_TIMEZONE = 'Asia/Jakarta';

/**
 * Get current date in Jakarta timezone as YYYY-MM-DD string
 */
export function getTodayInJakarta(): string {
  const now = toZonedTime(new Date(), JAKARTA_TIMEZONE);
  return format(now, 'yyyy-MM-dd');
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