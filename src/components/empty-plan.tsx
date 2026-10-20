import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarOff, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  dayLabel,
  planQueryString,
  type PlanQuery,
} from "@/lib/plan-query";

export function EmptyPlan({ query }: { query: PlanQuery }) {
  const studyDayHref = `/plan?${planQueryString({ ...query, day: "sat" })}`;
  const isDayOff = ["sun", "mon", "tue"].includes(query.day);

  return (
    <div className="space-y-6">
      <Link
        href={`/?${planQueryString(query)}`}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-white/75 px-3 text-xs font-semibold transition hover:border-primary/30 hover:bg-white"
      >
        <ArrowRight className="size-4" />
        تعديل البيانات
      </Link>

      <Card className="p-8 text-center sm:p-12">
        <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-secondary text-muted-foreground">
          <CalendarOff className="size-7" />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight sm:text-3xl">
          {isDayOff ? "اليوم ده أجازة" : `مفيش بيانات ليوم ${dayLabel(query.day)}`}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
          {isDayOff
            ? "الأحد والاتنين والثلاثاء مفيش فيهم محاضرات حسب الجدول. اختار يوم من أيام الدراسة."
            : "مفيش حصص مسجلة لليوم ده. جرّب يوم تاني من أيام الدراسة."}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button asChild>
            <Link href={studyDayHref}>
              جرّب يوم السبت
              <ArrowLeft />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/?${planQueryString(query)}`}>رجوع للفورم</Link>
          </Button>
        </div>
      </Card>

      <div className="flex items-start gap-2 rounded-2xl border border-indigo-100/80 bg-indigo-50/60 p-4 text-xs leading-6 text-indigo-800">
        <Info className="mt-0.5 size-4 shrink-0" />
        <span>
          البيانات الكاملة متاحة لأيام الجمعة والسبت والأربع والخميس.
          جرّب سكشن 15 وأسبوع W1 لأفضل مثال.
        </span>
      </div>
    </div>
  );
}
