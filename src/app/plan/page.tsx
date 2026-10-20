import type { Metadata } from "next";
import { EmptyPlan } from "@/components/empty-plan";
import { ResultsView } from "@/components/results-view";
import { planDay } from "@/lib/best-path";
import { parsePlanQuery } from "@/lib/plan-query";
import { readTimetable } from "@/lib/timetable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "خطتك",
};

interface PlanPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PlanPage({ searchParams }: PlanPageProps) {
  const query = parsePlanQuery(await searchParams);
  const timetable = await readTimetable();

  const result = planDay(timetable.sessions, {
    studentSection: query.section,
    week: query.week,
    day: query.day,
    strategy: query.strategy,
    maintenance: timetable.maintenance,
  });

  if (!result) {
    return <EmptyPlan query={query} />;
  }

  return <ResultsView query={query} result={result} />;
}
