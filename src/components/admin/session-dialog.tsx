"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toMinutes } from "@/lib/best-path";
import { DAYS, WEEKS } from "@/lib/plan-query";
import type { Day, Session, SessionType, Week } from "@/lib/types";

interface SessionDialogProps {
  mode: "add" | "edit";
  session?: Session;
  onClose: () => void;
  onSave: (payload: Omit<Session, "id">) => Promise<void>;
}

interface FormState {
  courseName: string;
  courseId: string;
  type: SessionType;
  week: Week;
  day: Day;
  start: string;
  end: string;
  instructor: string;
  room: string;
  sections: string;
}

const fieldClassName =
  "h-11 w-full rounded-xl border border-border bg-white/85 px-3 text-sm font-medium text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-white/[0.06] dark:focus:ring-primary/20";

const initialForm = (session?: Session): FormState => ({
  courseName: session?.courseName ?? "",
  courseId: session?.courseId ?? "",
  type: session?.type ?? "section",
  week: session?.week ?? "W1",
  day: session?.day ?? "sat",
  start: session?.start ?? "09:00",
  end: session?.end ?? "10:00",
  instructor: session?.instructor ?? "",
  room: session?.room ?? "",
  sections: session?.sections.join(", ") ?? "1",
});

export function SessionDialog({
  mode,
  session,
  onClose,
  onSave,
}: SessionDialogProps) {
  const [form, setForm] = useState<FormState>(() => initialForm(session));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, pending]);

  const update = <Key extends keyof FormState>(
    key: Key,
    value: FormState[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const rawSections = form.sections
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const sections = rawSections.map(Number);

    if (sections.length === 0) {
      setError("اكتب سكشن واحد على الأقل.");
      return;
    }

    if (
      sections.some(
        (value) => !Number.isInteger(value) || value < 1 || value > 15,
      )
    ) {
      setError("السكاشن لازم تكون أرقام من 1 لـ 15.");
      return;
    }

    if (toMinutes(form.start) >= toMinutes(form.end)) {
      setError("وقت النهاية لازم يكون بعد وقت البداية.");
      return;
    }

    setPending(true);

    try {
      await onSave({
        courseName: form.courseName.trim(),
        courseId: form.courseId.trim(),
        type: form.type,
        week: form.week,
        day: form.day,
        start: form.start,
        end: form.end,
        instructor: form.instructor.trim(),
        room: form.room.trim(),
        sections: [...new Set(sections)].sort((a, b) => a - b),
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "تعذر حفظ الحصة.",
      );
      setPending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={() => {
        if (!pending) onClose();
      }}
    >
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-dialog-title"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto p-5 shadow-2xl sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-primary">
              {mode === "add" ? "حصة جديدة" : "تعديل البيانات"}
            </p>
            <h2
              id="session-dialog-title"
              className="mt-1 text-xl font-extrabold tracking-tight"
            >
              {mode === "add" ? "إضافة حصة للجدول" : "تعديل الحصة"}
            </h2>
            {session && (
              <p className="mt-1 max-w-full truncate text-[10px] text-muted-foreground">
                {session.id}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            aria-label="إغلاق"
            className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="course-name" className="text-sm font-semibold">
                اسم المادة
              </label>
              <input
                id="course-name"
                value={form.courseName}
                onChange={(event) => update("courseName", event.target.value)}
                className={fieldClassName}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="course-id" className="text-sm font-semibold">
                معرف المادة
                <span className="ms-1 text-[10px] font-normal text-muted-foreground">
                  (اختياري)
                </span>
              </label>
              <input
                id="course-id"
                value={form.courseId}
                onChange={(event) => update("courseId", event.target.value)}
                placeholder="مثال: java"
                className={fieldClassName}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="session-type" className="text-sm font-semibold">
                النوع
              </label>
              <select
                id="session-type"
                value={form.type}
                onChange={(event) =>
                  update("type", event.target.value as SessionType)
                }
                className={fieldClassName}
              >
                <option value="section">سكشن</option>
                <option value="lecture">محاضرة</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="session-week" className="text-sm font-semibold">
                الأسبوع
              </label>
              <select
                id="session-week"
                value={form.week}
                onChange={(event) =>
                  update("week", event.target.value as Week)
                }
                className={fieldClassName}
              >
                {WEEKS.map((week) => (
                  <option key={week.value} value={week.value}>
                    {week.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="session-day" className="text-sm font-semibold">
                اليوم
              </label>
              <select
                id="session-day"
                value={form.day}
                onChange={(event) => update("day", event.target.value as Day)}
                className={fieldClassName}
              >
                {DAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="session-start" className="text-sm font-semibold">
                وقت البداية
              </label>
              <input
                id="session-start"
                type="time"
                value={form.start}
                onChange={(event) => update("start", event.target.value)}
                className={fieldClassName}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="session-end" className="text-sm font-semibold">
                وقت النهاية
              </label>
              <input
                id="session-end"
                type="time"
                value={form.end}
                onChange={(event) => update("end", event.target.value)}
                className={fieldClassName}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="session-instructor" className="text-sm font-semibold">
                المعيد / المحاضر
              </label>
              <input
                id="session-instructor"
                value={form.instructor}
                onChange={(event) => update("instructor", event.target.value)}
                className={fieldClassName}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="session-room" className="text-sm font-semibold">
                القاعة
              </label>
              <input
                id="session-room"
                value={form.room}
                onChange={(event) => update("room", event.target.value)}
                className={fieldClassName}
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="session-sections" className="text-sm font-semibold">
                السكاشن
              </label>
              <input
                id="session-sections"
                value={form.sections}
                onChange={(event) => update("sections", event.target.value)}
                placeholder="مثال: 1, 2, 3"
                className={fieldClassName}
                required
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
            >
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={pending}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={pending}>
              <Save />
              {pending
                ? "بنحفظ..."
                : mode === "add"
                  ? "إضافة الحصة"
                  : "حفظ التعديلات"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
