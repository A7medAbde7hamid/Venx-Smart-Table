import type { Metadata } from "next";
import { EmptyPlan } from "@/components/empty-plan";
import { ResultsView } from "@/components/results-view";
import { planDay } from "@/lib/best-path";
import { parsePlanQuery } from "@/lib/plan-query";
import { timetable } from "@/lib/timetable";

export const metadata: Metadata = {
  title: "خطتك",
};

interface PlanPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PlanPage({ searchParams }: PlanPageProps) {
  const query = parsePlanQuery(await searchParams);

  const result = planDay(timetable.sessions, {
    studentSection: query.section,
    week: query.week,
    day: query.day,
    strategy: query.strategy,
  });

  if (!result) {
    return <EmptyPlan query={query} />;
  }

  return <ResultsView query={query} result={result} />;
}
