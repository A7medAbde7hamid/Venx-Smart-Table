import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  Repeat2,
  Route,
  Sparkles,
  TrendingDown,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toMinutes, type PlanResult } from "@/lib/best-path";
import {
  formatChangeCount,
  formatClock,
  formatDuration,
  formatSections,
  formatSessionCount,
} from "@/lib/format";
import {
  dayLabel,
  planQueryString,
  strategyLabel,
  weekLabel,
  type PlanQuery,
} from "@/lib/plan-query";
import type { Session } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ResultsViewProps {
  query: PlanQuery;
  result: PlanResult;
}

export function ResultsView({ query, result }: ResultsViewProps) {
  const { best, own } = result;
  const ownByGroup = new Map(
    own.sessions.map((session) => [
      `${session.courseId}:${session.type}`,
      session,
    ]),
  );

  const changes = best.sessions.filter((session) => {
    const original = ownByGroup.get(`${session.courseId}:${session.type}`);
    return original ? original.id !== session.id : false;
  });

  return (
    <div className="space-y-9">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/?${planQueryString(query)}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <ArrowRight />
          تعديل البيانات
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="violet">
            <Sparkles />
            {strategyLabel(query.strategy)}
          </Badge>
          <Badge variant="outline">{weekLabel(query.week)}</Badge>
        </div>
      </div>

      <header className="max-w-2xl">
        <p className="text-sm font-bold text-primary">نتيجتك جاهزة</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          خطة يوم {dayLabel(query.day)}
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
          سكشن {query.section} · {weekLabel(query.week)} ·{" "}
          {formatSessionCount(best.sessions.length)}.{" "}
          {changes.length > 0
            ? `نقلنا ${formatSessionCount(
                changes.length,
              )} لسكشن تاني بنفس المعيد عشان نحسن يومك.`
            : "خطتك الحالية هي الأفضل حسب أولويتك."}
        </p>
      </header>

      <section
        aria-label="مقارنة الخطتين"
        className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch"
      >
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-muted-foreground">
              خطتك الأصلية
            </p>
            <Badge variant="secondary">زي ما هي</Badge>
          </div>
          <TimePair start={own.metrics.start} end={own.metrics.end} />
          <p className="mt-4 text-xs text-muted-foreground">
            {formatDuration(own.metrics.spanMinutes)} في الجامعة
          </p>
        </Card>

        <div className="hidden items-center justify-center lg:flex">
          <ArrowLeft className="size-6 text-primary/30" />
        </div>

        <Card className="relative overflow-hidden border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-white p-5 sm:p-6">
          <div className="pointer-events-none absolute -left-10 -top-10 size-32 rounded-full bg-emerald-200/40 blur-2xl" />
          <div className="relative flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-emerald-800">
              خطتنا المقترحة
            </p>
            <Badge variant="success">
              <CheckCircle2 />
              الأفضل لك
            </Badge>
          </div>
          <TimePair start={best.metrics.start} end={best.metrics.end} />

          <div className="relative mt-4 flex flex-wrap gap-2">
            {result.endSavedMinutes > 0 && (
              <Badge variant="success">
                <TrendingDown />
                تنصرف أبدر بـ {formatDuration(result.endSavedMinutes)}
              </Badge>
            )}
            {result.spanSavedMinutes > 0 && (
              <Badge variant="success">
                <Clock />
                وقت أقل بـ {formatDuration(result.spanSavedMinutes)}
              </Badge>
            )}
            {result.sameAsOwn && (
              <Badge variant="secondary">مفيش تغيير مطلوب</Badge>
            )}
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="الوصول" value={formatClock(best.metrics.start)} />
        <Metric label="الانصراف" value={formatClock(best.metrics.end)} />
        <Metric
          label="الوقت في الجامعة"
          value={formatDuration(best.metrics.spanMinutes)}
        />
        <Metric
          label="وقت الفراغ"
          value={formatDuration(best.metrics.idleMinutes)}
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">
              تفصيل اليوم
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              الحصص مرتبة من أول اليوم لآخره.
            </p>
          </div>
          {changes.length > 0 && (
            <Badge variant="warning">
              <Repeat2 />
              {formatChangeCount(changes.length)}
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          {best.sessions.map((session, index) => {
            const previous = index > 0 ? best.sessions[index - 1] : undefined;
            const gap = previous
              ? toMinutes(session.start) - toMinutes(previous.end)
              : 0;
            const original = ownByGroup.get(
              `${session.courseId}:${session.type}`,
            );
            const changed = original ? original.id !== session.id : false;

            return (
              <div key={session.id} className="space-y-3">
                {gap > 0 && <Gap minutes={gap} />}
                <SessionRow
                  session={session}
                  changed={changed}
                  original={original}
                />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function TimePair({ start, end }: { start: string; end: string }) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <div>
        <p className="text-[11px] font-medium text-muted-foreground">تبدأ</p>
        <p className="mt-1 text-xl font-extrabold tabular-nums">
          {formatClock(start)}
        </p>
      </div>
      <ArrowLeft className="size-4 text-muted-foreground/40" />
      <div className="text-left">
        <p className="text-[11px] font-medium text-muted-foreground">تنتهي</p>
        <p className="mt-1 text-xl font-extrabold tabular-nums">
          {formatClock(end)}
        </p>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="bg-white/70 p-4 text-center backdrop-blur-sm">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-extrabold">{value}</p>
    </Card>
  );
}

function Gap({ minutes }: { minutes: number }) {
  return (
    <div className="flex items-center gap-3 px-2 text-[11px] font-medium text-muted-foreground">
      <span className="h-px flex-1 border-t border-dashed border-border" />
      <span className="inline-flex items-center gap-1">
        <Clock className="size-3" />
        راحة {formatDuration(minutes)}
      </span>
      <span className="h-px flex-1 border-t border-dashed border-border" />
    </div>
  );
}

function SessionRow({
  session,
  changed,
  original,
}: {
  session: Session;
  changed: boolean;
  original?: Session;
}) {
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 pe-5 shadow-sm transition sm:p-5 sm:pe-6",
        changed
          ? "border-amber-200 bg-amber-50/70"
          : "border-border/80 bg-white/85 hover:border-primary/25",
      )}
    >
      <span
        className={cn(
          "absolute inset-y-4 end-0 w-1 rounded-full",
          changed ? "bg-amber-400" : "bg-primary/25",
        )}
      />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-extrabold">{session.courseName}</h3>
            <Badge
              variant={session.type === "lecture" ? "violet" : "secondary"}
            >
              {session.type === "lecture" ? "محاضرة" : "سكشن"}
            </Badge>
            {changed && (
              <Badge variant="warning">
                <Repeat2 />
                تم التبديل
              </Badge>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <UserRound className="size-3.5" />
              {session.instructor}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {session.room}
            </span>
            <span className="inline-flex items-center gap-1">
              <Route className="size-3.5" />
              {formatSections(session.sections)}
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-white/75 px-3 py-2 text-left shadow-sm ring-1 ring-border/60">
          <p className="text-sm font-bold tabular-nums">
            {formatClock(session.start)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            لحد {formatClock(session.end)}
          </p>
        </div>
      </div>

      {changed && original && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-amber-100/70 px-3 py-2 text-xs font-medium text-amber-900">
          <Repeat2 className="size-3.5" />
          {session.type === "section"
            ? `بدلًا من ${formatSections(original.sections)} — نفس المعيد ${session.instructor}`
            : `بدلًا من ${formatClock(original.start)} – ${formatClock(
                original.end,
              )}`}
        </div>
      )}
    </article>
  );
}
