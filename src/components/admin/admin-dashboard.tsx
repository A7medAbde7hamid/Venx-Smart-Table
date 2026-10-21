"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  CheckCircle2,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DAYS, dayLabel, SECTIONS } from "@/lib/plan-query";
import type { Day, Session, Timetable } from "@/lib/types";
import { MaintenanceCard } from "./maintenance-card";
import { SessionDialog } from "./session-dialog";

const DAY_ORDER = Object.fromEntries(
  DAYS.map((day, index) => [day.value, index]),
) as Record<Day, number>;

const selectClassName =
  "h-11 w-full cursor-pointer rounded-xl border border-border bg-popover px-3 text-sm font-medium text-popover-foreground shadow-sm outline-none transition focus:border-primary focus:bg-accent focus:text-accent-foreground focus:ring-4 focus:ring-primary/10 dark:focus:ring-primary/20";

const formatClock = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  const suffix = hour >= 12 ? "م" : "ص";
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${suffix}`;
};

const formatSections = (sections: number[]) =>
  sections.length === 1
    ? `سكشن ${sections[0]}`
    : `سكاشن ${sections[0]}–${sections[sections.length - 1]}`;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json" },
  });

  if (response.status === 401) {
    window.location.assign("/admin/login");
    throw new Error("انتهت الجلسة. سجّل الدخول تاني.");
  }

  const data = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;

  if (!response.ok) {
    throw new Error(
      data?.error ??
        `تعذر تنفيذ الطلب (${response.status}). راجع سجلات السيرفر.`,
    );
  }

  return data as T;
}

interface AdminDashboardProps {
  initialTimetable: Timetable;
}

type DialogState =
  | { mode: "add" }
  | { mode: "edit"; session: Session }
  | null;

type Message = { type: "success" | "error"; text: string };

export function AdminDashboard({ initialTimetable }: AdminDashboardProps) {
  const [timetable, setTimetable] = useState(initialTimetable);
  const [dayFilter, setDayFilter] = useState<"all" | Day>("all");
  const [sectionFilter, setSectionFilter] = useState<"all" | number>("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (!message) return;

    const timeout = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  const rooms = useMemo(
    () =>
      Array.from(new Set(timetable.sessions.map((session) => session.room))).sort(
        (a, b) => a.localeCompare(b, "ar"),
      ),
    [timetable.sessions],
  );

  const courses = useMemo(
    () =>
      Array.from(
        new Set(timetable.sessions.map((session) => session.courseName)),
      ).sort((a, b) => a.localeCompare(b, "ar")),
    [timetable.sessions],
  );

  const filteredSessions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return timetable.sessions
      .filter((session) => {
        if (dayFilter !== "all" && session.day !== dayFilter) return false;
        if (sectionFilter !== "all" && !session.sections.includes(sectionFilter))
          return false;
        if (courseFilter !== "all" && session.courseName !== courseFilter)
          return false;

        if (query) {
          const haystack =
            `${session.courseName} ${session.instructor} ${session.room} ${session.id}`.toLowerCase();
          if (!haystack.includes(query)) return false;
        }

        return true;
      })
      .sort(
        (a, b) =>
          DAY_ORDER[a.day] - DAY_ORDER[b.day] ||
          a.start.localeCompare(b.start) ||
          a.courseName.localeCompare(b.courseName, "ar"),
      );
  }, [timetable.sessions, dayFilter, sectionFilter, courseFilter, search]);

  const notify = (type: Message["type"], text: string) => {
    setMessage({ type, text });
  };

  const refresh = async () => {
    const data = await request<Timetable>("/api/admin/timetable", {
      cache: "no-store",
    });
    setTimetable(data);
  };

  const handleSave = async (payload: Omit<Session, "id">) => {
    const editingId = dialog?.mode === "edit" ? dialog.session.id : null;

    setBusy(true);

    try {
      await request(
        editingId
          ? `/api/admin/sessions/${encodeURIComponent(editingId)}`
          : "/api/admin/sessions",
        {
          method: editingId ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      await refresh();
      setDialog(null);
      notify(
        "success",
        editingId ? "تم حفظ تعديلات الحصة." : "تمت إضافة الحصة للجدول.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (session: Session) => {
    if (
      !window.confirm(
        `تأكيد حذف "${session.courseName}" — ${dayLabel(session.day)} ${formatClock(session.start)}؟`,
      )
    ) {
      return;
    }

    setBusy(true);

    try {
      await request(`/api/admin/sessions/${encodeURIComponent(session.id)}`, {
        method: "DELETE",
      });
      await refresh();
      notify("success", "تم حذف الحصة.");
    } catch (error) {
      notify(
        "error",
        error instanceof Error ? error.message : "تعذر حذف الحصة.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleToggleMaintenance = async (day: Day, room: string) => {
    setBusy(true);

    try {
      const result = await request<{ action: "added" | "removed" }>(
        "/api/admin/maintenance",
        {
          method: "POST",
          body: JSON.stringify({ day, room }),
        },
      );
      await refresh();
      notify(
        "success",
        result.action === "added"
          ? `تم تعطيل ${room} يوم ${dayLabel(day)}.`
          : `تم إلغاء صيانة ${room} يوم ${dayLabel(day)}.`,
      );
    } catch (error) {
      notify(
        "error",
        error instanceof Error ? error.message : "تعذر تحديث الصيانة.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {message && (
        <div
          role="status"
          className={
            message.type === "success"
              ? "flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
              : "flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
          }
        >
          {message.type === "success" ? (
            <CheckCircle2 className="size-4 shrink-0" />
          ) : (
            <AlertCircle className="size-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="إجمالي الحصص"
          value={timetable.sessions.length}
          icon={<CalendarDays />}
        />
        <StatCard
          label="نتائج الفلتر"
          value={filteredSessions.length}
          icon={<Filter />}
        />
        <StatCard
          label="قاعات تحت الصيانة"
          value={timetable.maintenance.length}
          icon={<Wrench />}
          tone="warning"
        />
        <StatCard
          label="عدد القاعات"
          value={rooms.length}
          icon={<Building2 />}
        />
      </div>

      <MaintenanceCard
        maintenance={timetable.maintenance}
        rooms={rooms}
        busy={busy}
        onToggle={handleToggleMaintenance}
      />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 p-4">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">
              حصص الجدول
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              عدّل أي حصة أو أضف حصة جديدة مباشرة في قاعدة البيانات.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setDialog({ mode: "add" })}
            disabled={busy}
          >
            <Plus />
            إضافة حصة
          </Button>
        </div>

        <div className="grid gap-3 border-b border-border/70 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.4fr_1.2fr]">
          <div className="space-y-1.5">
            <label htmlFor="filter-day" className="text-xs font-semibold">
              اليوم
            </label>
            <select
              id="filter-day"
              value={dayFilter}
              onChange={(event) =>
                setDayFilter(event.target.value as "all" | Day)
              }
              className={selectClassName}
            >
              <option value="all">كل الأيام</option>
              {DAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="filter-section" className="text-xs font-semibold">
              السكشن
            </label>
            <select
              id="filter-section"
              value={String(sectionFilter)}
              onChange={(event) =>
                setSectionFilter(
                  event.target.value === "all"
                    ? "all"
                    : Number(event.target.value),
                )
              }
              className={selectClassName}
            >
              <option value="all">كل السكاشن</option>
              {SECTIONS.map((section) => (
                <option key={section} value={section}>
                  سكشن {section}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="filter-course" className="text-xs font-semibold">
              المادة
            </label>
            <select
              id="filter-course"
              value={courseFilter}
              onChange={(event) => setCourseFilter(event.target.value)}
              className={selectClassName}
            >
              <option value="all">كل المواد</option>
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="filter-search" className="text-xs font-semibold">
              بحث
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="filter-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="مادة، معيد، قاعة..."
                className="h-11 w-full rounded-xl border border-border bg-white/85 pe-9 ps-3 text-sm font-medium text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-white/[0.06] dark:focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        <div className="max-h-[44rem] overflow-auto">
          <table className="w-full min-w-[1050px] border-collapse text-right text-sm">
            <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
              <tr className="border-b border-border/70 text-xs text-muted-foreground">
                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  المادة
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  النوع
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  الأسبوع
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  اليوم
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  الوقت
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  القاعة
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  المعيد
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  السكاشن
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => (
                <tr
                  key={session.id}
                  className="border-b border-border/50 align-middle transition hover:bg-secondary/40"
                >
                  <td className="px-4 py-3">
                    <p className="font-bold">{session.courseName}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {session.courseId}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={session.type === "lecture" ? "accent" : "secondary"}
                    >
                      {session.type === "lecture" ? "محاضرة" : "سكشن"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{session.week}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {dayLabel(session.day)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3" dir="ltr">
                    {formatClock(session.start)} — {formatClock(session.end)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {session.room}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {session.instructor}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                    {formatSections(session.sections)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setDialog({ mode: "edit", session })
                        }
                        disabled={busy}
                        aria-label={`تعديل ${session.courseName}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => void handleDelete(session)}
                        disabled={busy}
                        aria-label={`حذف ${session.courseName}`}
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-300 dark:hover:bg-rose-500/10"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredSessions.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              مفيش حصص مطابقة للفلاتر الحالية.
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 px-4 py-3 text-xs text-muted-foreground">
          <span>
            عرض {filteredSessions.length} من {timetable.sessions.length} حصة
          </span>
          <button
            type="button"
            onClick={() => {
              setDayFilter("all");
              setSectionFilter("all");
              setCourseFilter("all");
              setSearch("");
            }}
            className="font-semibold text-primary transition hover:underline"
          >
            مسح الفلاتر
          </button>
        </div>
      </Card>

      {dialog && (
        <SessionDialog
          key={dialog.mode === "edit" ? dialog.session.id : "new-session"}
          mode={dialog.mode}
          session={dialog.mode === "edit" ? dialog.session : undefined}
          onClose={() => setDialog(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone?: "default" | "warning";
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span
        className={
          tone === "warning"
            ? "grid size-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 [&_svg]:size-5"
            : "grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-emerald-200 [&_svg]:size-5"
        }
      >
        {icon}
      </span>
      <div>
        <p className="text-2xl font-extrabold leading-none tracking-tight">
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}
