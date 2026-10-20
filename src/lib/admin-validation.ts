import { randomUUID } from "node:crypto";
import type { Day, MaintenanceWindow, Session, SessionType, Week } from "./types";

const DAYS: Day[] = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"];
const WEEKS: Week[] = ["W1", "W2"];
const TYPES: SessionType[] = ["lecture", "section"];

type SessionInput = Record<string, unknown>;

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

const text = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const isTime = (value: string): boolean =>
  /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value);

const minutes = (value: string): number => {
  const [hours, mins] = value.split(":").map(Number);
  return hours * 60 + mins;
};

export const slugify = (value: string): string =>
  value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

export const roomKey = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const parseSections = (value: unknown): number[] | null => {
  const raw = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : null;

  if (!raw) return null;

  const parsed = raw.map((item) => Number(item));

  if (
    parsed.length === 0 ||
    parsed.some(
      (item) => !Number.isInteger(item) || item < 1 || item > 15,
    )
  ) {
    return null;
  }

  const sections = [...new Set(parsed)].sort((a, b) => a - b);

  return sections.length === parsed.length ? sections : null;
};

export function validateSessionInput(
  input: unknown,
): ValidationResult<Omit<Session, "id">> {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "بيانات الحصة غير صالحة." };
  }

  const data = input as SessionInput;
  const courseName = text(data.courseName);
  const rawCourseId = text(data.courseId).toLowerCase();
  const derivedCourseId = slugify(courseName)
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const courseId =
    rawCourseId ||
    derivedCourseId ||
    `course-${randomUUID().slice(0, 8)}`;
  const type = text(data.type) as SessionType;
  const week = text(data.week) as Week;
  const day = text(data.day) as Day;
  const start = text(data.start);
  const end = text(data.end);
  const instructor = text(data.instructor);
  const room = text(data.room);
  const sections = parseSections(data.sections);

  if (!courseName) return { ok: false, error: "اسم المادة مطلوب." };
  if (!/^[a-z0-9-]+$/.test(courseId)) {
    return { ok: false, error: "معرف المادة لازم يكون حروف إنجليزية وأرقام وشرطات." };
  }
  if (!TYPES.includes(type)) return { ok: false, error: "نوع الحصة غير صالح." };
  if (!WEEKS.includes(week)) return { ok: false, error: "الأسبوع غير صالح." };
  if (!DAYS.includes(day)) return { ok: false, error: "اليوم غير صالح." };
  if (!isTime(start) || !isTime(end)) {
    return { ok: false, error: "صيغة الوقت غير صالحة." };
  }
  if (minutes(start) >= minutes(end)) {
    return { ok: false, error: "وقت النهاية لازم يكون بعد وقت البداية." };
  }
  if (!instructor) return { ok: false, error: "اسم المعيد مطلوب." };
  if (!room) return { ok: false, error: "القاعة مطلوبة." };
  if (!sections) {
    return { ok: false, error: "السكاشن لازم تكون أرقام من 1 لـ 15 بدون تكرار." };
  }

  return {
    ok: true,
    value: {
      courseId,
      courseName,
      type,
      week,
      day,
      start,
      end,
      instructor,
      room,
      sections,
    },
  };
}

export function findSessionConflict(
  sessions: Session[],
  candidate: Omit<Session, "id">,
  ignoreId?: string,
): Session | null {
  return (
    sessions.find(
      (session) =>
        session.id !== ignoreId &&
        session.week === candidate.week &&
        session.day === candidate.day &&
        session.start < candidate.end &&
        session.end > candidate.start &&
        session.sections.some((section) =>
          candidate.sections.includes(section),
        ),
    ) ?? null
  );
}

export function createSessionId(session: Omit<Session, "id">): string {
  const base = [
    session.courseId,
    session.sections.join("-"),
    session.week.toLowerCase(),
    session.day,
    session.start.replace(":", ""),
    session.end.replace(":", ""),
    session.type,
    slugify(session.room),
  ]
    .filter(Boolean)
    .join("-");

  return `${base}-${randomUUID().slice(0, 8)}`;
}

export function validateMaintenanceInput(
  input: unknown,
): ValidationResult<Pick<MaintenanceWindow, "day" | "room" | "note">> {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "بيانات الصيانة غير صالحة." };
  }

  const data = input as SessionInput;
  const day = text(data.day) as Day;
  const room = text(data.room);
  const note = text(data.note);

  if (!DAYS.includes(day)) return { ok: false, error: "اليوم غير صالح." };
  if (!room) return { ok: false, error: "القاعة مطلوبة." };

  return { ok: true, value: { day, room, note: note || undefined } };
}

export function createMaintenanceId(): string {
  return `maintenance-${randomUUID().slice(0, 8)}`;
}
