import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { planDay, toMinutes } from "./best-path.ts";
import type { Session, Timetable } from "./types.ts";

const timetable = JSON.parse(
  readFileSync(new URL("../../data/timetable.json", import.meta.url), "utf8"),
) as Timetable;

const sectionSession = (sessions: Session[], courseId: string) =>
  sessions.find(
    (session) => session.courseId === courseId && session.type === "section",
  );

test("section 15, W1: move Java to section 11 and finish at 17:00", () => {
  const result = planDay(timetable.sessions, {
    studentSection: 15,
    week: "W1",
    day: "sat",
  });

  assert.ok(result);
  assert.equal(result.own.metrics.end, "18:00");
  assert.equal(result.best.metrics.end, "17:00");
  assert.equal(result.best.metrics.start, "10:00");
  assert.equal(result.endSavedMinutes, 60);
  assert.equal(result.spanSavedMinutes, 60);
  assert.deepEqual(sectionSession(result.best.sessions, "java")?.sections, [11]);
  assert.equal(sectionSession(result.best.sessions, "java")?.instructor, "Eng. Mohamed Omar");
});

test("section 13, W1: move Expert Systems to section 15 and finish at 17:00", () => {
  const result = planDay(timetable.sessions, {
    studentSection: 13,
    week: "W1",
    day: "sat",
  });

  assert.ok(result);
  assert.equal(result.own.metrics.end, "18:00");
  assert.equal(result.best.metrics.end, "17:00");
  assert.equal(result.endSavedMinutes, 60);
  assert.deepEqual(sectionSession(result.best.sessions, "expert-systems")?.sections, [15]);
  assert.deepEqual(sectionSession(result.best.sessions, "java")?.sections, [13]);
});

test("week filter: W2 plan never contains W1 sessions", () => {
  const result = planDay(timetable.sessions, {
    studentSection: 13,
    week: "W2",
    day: "sat",
  });

  assert.ok(result);
  assert.ok(result.best.sessions.every((session) => session.week === "W2"));
  assert.equal(result.best.metrics.end, "16:00");
});

const PLAN_DAYS = ["fri", "sat", "wed", "thu"] as const;
const SECTIONS = Array.from({ length: 15 }, (_, index) => index + 1);
const WEEKS = ["W1", "W2"] as const;

test("every swapped section keeps the student's original TA", () => {
  for (const day of PLAN_DAYS) {
    for (const studentSection of SECTIONS) {
      for (const week of WEEKS) {
        const result = planDay(timetable.sessions, {
          studentSection,
          week,
          day,
        });
        if (!result) continue;

        for (const picked of result.best.sessions) {
          if (picked.type !== "section") continue;
          const own = sectionSession(result.own.sessions, picked.courseId);
          if (!own) continue;
          assert.equal(
            picked.instructor.trim().toLowerCase(),
            own.instructor.trim().toLowerCase(),
            `${day} ${week} ${studentSection} ${picked.courseId} TA mismatch`,
          );
        }
      }
    }
  }
});

test("chosen sessions never overlap", () => {
  for (const day of PLAN_DAYS) {
    for (const studentSection of SECTIONS) {
      for (const week of WEEKS) {
        const result = planDay(timetable.sessions, {
          studentSection,
          week,
          day,
        });
        if (!result) continue;

        const sorted = [...result.best.sessions].sort(
          (a, b) => toMinutes(a.start) - toMinutes(b.start),
        );
        for (let index = 1; index < sorted.length; index += 1) {
          assert.ok(
            toMinutes(sorted[index - 1].end) <= toMinutes(sorted[index].start),
            `${sorted[index - 1].id} overlaps ${sorted[index].id}`,
          );
        }
      }
    }
  }
});

test("full timetable covers every section on every study day", () => {
  assert.ok(
    timetable.sessions.every(
      (session) => !["sun", "mon", "tue"].includes(session.day),
    ),
    "days off should not contain sessions",
  );

  for (const day of PLAN_DAYS) {
    for (const week of WEEKS) {
      for (const studentSection of SECTIONS) {
        const own = timetable.sessions.filter(
          (session) =>
            session.day === day &&
            session.week === week &&
            session.sections.includes(studentSection),
        );
        assert.ok(
          own.length > 0,
          `${day} ${week} section ${studentSection} has no sessions`,
        );
      }
    }
  }
});

test("session ids are unique", () => {
  const ids = timetable.sessions.map((session) => session.id);
  assert.equal(new Set(ids).size, ids.length);
});
