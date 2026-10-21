"use client";

import {
  useEffect,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Info,
  Sunrise,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DAYS,
  SECTIONS,
  STRATEGIES,
  WEEKS,
  planQueryString,
  type PlanQuery,
} from "@/lib/plan-query";
import { cn } from "@/lib/utils";

const selectClassName =
  "h-11 w-full cursor-pointer rounded-xl border border-border bg-popover ps-3 pe-10 text-sm font-medium text-popover-foreground shadow-sm outline-none transition focus:border-primary focus:bg-accent focus:text-accent-foreground focus:ring-4 focus:ring-primary/10 dark:focus:ring-primary/20";

export function PlanForm({ initial }: { initial: PlanQuery }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [section, setSection] = useState(initial.section);
  const [week, setWeek] = useState(initial.week);
  const [day, setDay] = useState(initial.day);
  const [strategy, setStrategy] = useState(initial.strategy);

  useEffect(() => {
    const query = planQueryString({ section, week, day, strategy });
    window.history.replaceState(null, "", `/?${query}`);
  }, [section, week, day, strategy]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query: PlanQuery = { section, week, day, strategy };
    startTransition(() => {
      router.push(`/plan?${planQueryString(query)}`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge variant="default" className="mb-3">
            الخطوة الأولى
          </Badge>
          <h2 className="text-xl font-extrabold tracking-tight">
            قول لنا على جدولك
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            اختار بياناتك، وهنجهز لك خطة اليوم في لحظة.
          </p>
        </div>
        <Badge variant="success">
          <CheckCircle2 />
          نفس المعيد
        </Badge>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="section" className="text-sm font-semibold">
            رقم السكشن
          </label>
          <select
            id="section"
            value={section}
            onChange={(event) => setSection(Number(event.target.value))}
            className={selectClassName}
          >
            {SECTIONS.map((value) => (
              <option key={value} value={value}>
                سكشن {value}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="day" className="text-sm font-semibold">
            اليوم
          </label>
          <select
            id="day"
            value={day}
            onChange={(event) => setDay(event.target.value as PlanQuery["day"])}
            className={selectClassName}
          >
            {DAYS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">الأسبوع</legend>
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-border/70 bg-secondary/60 p-1.5">
          {WEEKS.map((item) => {
            const active = week === item.value;
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={active}
                onClick={() => setWeek(item.value)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  active
                    ? "bg-white text-foreground shadow-sm ring-1 ring-border/70 dark:bg-white/[0.08]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                    active
                      ? "bg-primary/10 text-primary"
                      : "bg-white/60 text-muted-foreground dark:bg-white/[0.06]",
                  )}
                >
                  {item.short}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">إيه أولويتك؟</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {STRATEGIES.map((item) => {
            const active = strategy === item.value;
            const Icon = item.value === "finish-early" ? Sunrise : Timer;
            return (
              <label
                key={item.value}
                className={cn(
                  "relative cursor-pointer rounded-2xl border p-4 transition-all focus-within:ring-2 focus-within:ring-primary/30",
                  active
                    ? "border-primary bg-primary/[0.04] ring-1 ring-primary"
                    : "border-border bg-white/70 hover:border-primary/30 hover:bg-white dark:bg-white/[0.03] dark:hover:bg-white/[0.06]",
                )}
              >
                <input
                  type="radio"
                  name="strategy"
                  value={item.value}
                  checked={active}
                  onChange={() => setStrategy(item.value)}
                  className="sr-only"
                />
                <span className="flex items-center gap-2 text-sm font-bold">
                  <span
                    className={cn(
                      "grid size-8 place-items-center rounded-lg",
                      active
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  {item.label}
                </span>
                <span className="mt-2 block text-xs leading-5 text-muted-foreground">
                  {item.description}
                </span>
                {active && (
                  <CheckCircle2 className="absolute end-3 top-3 size-4 text-primary" />
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-3">
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={pending}
        >
          {pending ? "بنحسب خطتك..." : "احسب خطتي"}
          {!pending && <ArrowLeft />}
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Info className="size-3.5" />
          البيانات الكاملة للترم — الجمعة والسبت والأربع والخميس.
        </p>
      </div>
    </form>
  );
}
