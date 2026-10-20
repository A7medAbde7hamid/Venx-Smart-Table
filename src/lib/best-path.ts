import type { Day, Session, Week } from "./types.ts";

export type PlanStrategy = "finish-early" | "shortest-day";

export interface PlanMetrics {
  startMinutes: number;
  endMinutes: number;
  earliestStart: string;
  spanMinutes: number;
  classMinutes: number;
  idleMinutes: number;
  swaps: number;
  start: string;
  end: string;
}

export interface Plan {
  sessions: Session[];
  metrics: PlanMetrics;
}

export interface PlanResult {
  best: Plan;
  own: Plan;
  endSavedMinutes: number;
  spanSavedMinutes: number;
  sameAsOwn: boolean;
}

export interface PlanOptions {
  studentSection: number;
  week: Week;
  day: Day;
  strategy?: PlanStrategy;
}

export const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export const toTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
};

const overlaps = (a: Session, b: Session): boolean =>
  toMinutes(a.start) < toMinutes(b.end) && toMinutes(b.start) < toMinutes(a.end);

const nameKey = (name: string): string =>
  name.trim().toLowerCase().replace(/\s+/g, " ");

const sameInstructor = (a: Session, b: Session): boolean =>
  nameKey(a.instructor) === nameKey(b.instructor);

const dedupe = (sessions: Session[]): Session[] => {
  const seen = new Set<string>();
  const result: Session[] = [];
  for (const session of sessions) {
    const key = [
      session.courseId,
      session.type,
      session.start,
      session.end,
      nameKey(session.instructor),
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(session);
  }
  return result;
};

const metricsOf = (sessions: Session[], studentSection: number): PlanMetrics => {
  const starts = sessions.map((session) => toMinutes(session.start));
  const ends = sessions.map((session) => toMinutes(session.end));
  const startMinutes = Math.min(...starts);
  const endMinutes = Math.max(...ends);
  const classMinutes = sessions.reduce(
    (total, session) => total + toMinutes(session.end) - toMinutes(session.start),
    0,
  );
  return {
    startMinutes,
    endMinutes,
    earliestStart: toTime(startMinutes),
    spanMinutes: endMinutes - startMinutes,
    classMinutes,
    idleMinutes: endMinutes - startMinutes - classMinutes,
    swaps: sessions.filter(
      (session) => session.type === "section" && !session.sections.includes(studentSection),
    ).length,
    start: toTime(startMinutes),
    end: toTime(endMinutes),
  };
};

const compare = (a: PlanMetrics, b: PlanMetrics, strategy: PlanStrategy): number => {
  const left =
    strategy === "shortest-day"
      ? [a.spanMinutes, a.endMinutes, a.idleMinutes, a.swaps]
      : [a.endMinutes, toMinutes(a.earliestStart), a.spanMinutes, a.swaps];
  const right =
    strategy === "shortest-day"
      ? [b.spanMinutes, b.endMinutes, b.idleMinutes, b.swaps]
      : [b.endMinutes, toMinutes(b.earliestStart), b.spanMinutes, b.swaps];
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
};

export function planDay(
  sessions: Session[],
  options: PlanOptions,
): PlanResult | null {
  const { studentSection, week, day, strategy = "finish-early" } = options;

  const daySessions = sessions.filter(
    (session) => session.day === day && session.week === week,
  );
  const ownSessions = daySessions.filter((session) =>
    session.sections.includes(studentSection),
  );
  if (ownSessions.length === 0) return null;

  const ownByGroup = new Map<string, Session>();
  for (const session of ownSessions) {
    const key = `${session.courseId}:${session.type}`;
    if (!ownByGroup.has(key)) ownByGroup.set(key, session);
  }

  const groups = [...ownByGroup.values()]
    .map((own) => {
      const options = daySessions.filter(
        (session) =>
          session.courseId === own.courseId &&
          session.type === own.type &&
          (own.type === "lecture"
            ? session.sections.includes(studentSection)
            : sameInstructor(session, own)),
      );
      const ordered = options.sort((a, b) => {
        const byStart = toMinutes(a.start) - toMinutes(b.start);
        if (byStart !== 0) return byStart;
        return (
          Number(b.sections.includes(studentSection)) -
          Number(a.sections.includes(studentSection))
        );
      });
      return { options: dedupe(ordered) };
    })
    .sort((a, b) => a.options.length - b.options.length);

  const ownPlanSessions = [...ownByGroup.values()].sort(
    (a, b) => toMinutes(a.start) - toMinutes(b.start),
  );
  const ownPlan: Plan = {
    sessions: ownPlanSessions,
    metrics: metricsOf(ownPlanSessions, studentSection),
  };

  let best = ownPlan;
  const chosen: Session[] = [];

  const canStillWin = (partial: Session[]): boolean => {
    if (partial.length === 0) return true;
    const metrics = metricsOf(partial, studentSection);
    return strategy === "shortest-day"
      ? metrics.spanMinutes <= best.metrics.spanMinutes
      : metrics.endMinutes <= best.metrics.endMinutes;
  };

  const search = (index: number): void => {
    if (index === groups.length) {
      const metrics = metricsOf(chosen, studentSection);
      if (compare(metrics, best.metrics, strategy) < 0) {
        best = {
          sessions: [...chosen].sort(
            (a, b) => toMinutes(a.start) - toMinutes(b.start),
          ),
          metrics,
        };
      }
      return;
    }

    if (!canStillWin(chosen)) return;

    for (const option of groups[index].options) {
      if (chosen.some((picked) => overlaps(picked, option))) continue;
      chosen.push(option);
      search(index + 1);
      chosen.pop();
    }
  };

  search(0);

  const bestIds = new Set(best.sessions.map((session) => session.id));
  const sameAsOwn =
    best.sessions.length === ownPlan.sessions.length &&
    ownPlan.sessions.every((session) => bestIds.has(session.id));

  return {
    best,
    own: ownPlan,
    endSavedMinutes: ownPlan.metrics.endMinutes - best.metrics.endMinutes,
    spanSavedMinutes:
      ownPlan.metrics.spanMinutes - best.metrics.spanMinutes,
    sameAsOwn,
  };
}
