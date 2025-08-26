import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
const JAKARTA_TIMEZONE = "Asia/Jakarta";
function getTodayInJakarta() {
  const now = toZonedTime(/* @__PURE__ */ new Date(), JAKARTA_TIMEZONE);
  return format(now, "yyyy-MM-dd");
}
function processPlanItems(planItems) {
  const todayStr = getTodayInJakarta();
  return planItems.map((item) => {
    const startDate = item.start_date || todayStr;
    let endDate = startDate;
    if (item.days && item.days > 0) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + item.days - 1);
      endDate = format(end, "yyyy-MM-dd");
    }
    const status = new Date(endDate) >= new Date(todayStr) ? "active" : "done";
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
function recomputePlanStatuses(planItems) {
  const todayStr = getTodayInJakarta();
  return planItems.map((item) => ({
    ...item,
    status: new Date(item.end_date) >= new Date(todayStr) ? "active" : "done"
  }));
}
function addPlanItems(existingPlan, newItems) {
  const processedNewItems = processPlanItems(newItems);
  const updatedExistingItems = recomputePlanStatuses(existingPlan);
  return [...updatedExistingItems, ...processedNewItems];
}
function splitPlanItems(planItems) {
  const active = planItems.filter((item) => item.status === "active");
  const done = planItems.filter((item) => item.status === "done");
  return { active, done };
}
function formatPlanItemForDisplay(item) {
  const parts = [];
  parts.push(item.drug);
  if (item.dose) {
    parts.push(item.dose);
  }
  if (item.route) {
    parts.push(item.route);
  }
  if (item.freq) {
    parts.push(item.freq);
  }
  if (item.days) {
    const endDate = format(new Date(item.end_date), "dd MMM");
    if (item.status === "active") {
      parts.push(`(${item.days} hari, sampai ${endDate})`);
    } else {
      parts.push(`(${item.days} hari, selesai ${endDate})`);
    }
  }
  return parts.join(" ");
}
function generatePlanSummary(planItems) {
  const { active, done } = splitPlanItems(planItems);
  const lines = [];
  if (active.length > 0) {
    lines.push("Plan Aktif");
    active.forEach((item) => {
      lines.push(`- ${formatPlanItemForDisplay(item)}`);
    });
  }
  if (done.length > 0) {
    if (active.length > 0) {
      lines.push("");
      lines.push("---- Plan Selesai");
    } else {
      lines.push("Plan Selesai");
    }
    done.forEach((item) => {
      lines.push(`- ${formatPlanItemForDisplay(item)}`);
    });
  }
  if (active.length === 0 && done.length === 0) {
    lines.push("Tidak ada plan");
  }
  return lines.join("\n");
}
export {
  addPlanItems as a,
  generatePlanSummary as g,
  processPlanItems as p,
  recomputePlanStatuses as r
};
