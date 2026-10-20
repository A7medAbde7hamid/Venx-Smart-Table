import type { PlanStrategy } from "./best-path";
import type { Day, Week } from "./types";

export const SECTIONS = Array.from({ length: 15 }, (_, index) => index + 1);

export const DAYS: { value: Day; label: string }[] = [
  { value: "sat", label: "السبت" },
  { value: "sun", label: "الأحد" },
  { value: "mon", label: "الاتنين" },
  { value: "tue", label: "الثلاثاء" },
  { value: "wed", label: "الأربع" },
  { value: "thu", label: "الخميس" },
  { value: "fri", label: "الجمعة" },
];

export const WEEKS: { value: Week; label: string; short: string }[] = [
  { value: "W1", label: "الأسبوع الأول", short: "W1" },
  { value: "W2", label: "الأسبوع التاني", short: "W2" },
];

export const STRATEGIES: {
  value: PlanStrategy;
  label: string;
  description: string;
}[] = [
  {
    value: "finish-early",
    label: "أروح بدري",
    description: "الأولوية إنك تخلص بدري، حتى لو معناها تبدأ يومك أبدر شوية.",
  },
  {
    value: "shortest-day",
    label: "أقصر يوم",
    description: "الأولوية إنك تقضي أقل وقت ممكن داخل الجامعة.",
  },
];

export interface PlanQuery {
  section: number;
  week: Week;
  day: Day;
  strategy: PlanStrategy;
}

const firstValue = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export function parsePlanQuery(
  params: Record<string, string | string[] | undefined>,
): PlanQuery {
  const sectionValue = Number(firstValue(params.section));
  const section = SECTIONS.includes(sectionValue) ? sectionValue : 15;

  const week = firstValue(params.week) === "W2" ? "W2" : "W1";

  const dayValue = firstValue(params.day);
  const day = DAYS.some((item) => item.value === dayValue)
    ? (dayValue as Day)
    : "sat";

  const strategy =
    firstValue(params.strategy) === "shortest-day"
      ? "shortest-day"
      : "finish-early";

  return { section, week, day, strategy };
}

export function planQueryString(query: PlanQuery): string {
  return new URLSearchParams({
    section: String(query.section),
    week: query.week,
    day: query.day,
    strategy: query.strategy,
  }).toString();
}

export function dayLabel(day: Day): string {
  return DAYS.find((item) => item.value === day)?.label ?? "السبت";
}

export function weekLabel(week: Week): string {
  return WEEKS.find((item) => item.value === week)?.label ?? "الأسبوع الأول";
}

export function strategyLabel(strategy: PlanStrategy): string {
  return STRATEGIES.find((item) => item.value === strategy)?.label ?? "أروح بدري";
}
