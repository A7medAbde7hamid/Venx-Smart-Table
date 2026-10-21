import assert from "node:assert/strict";
import test from "node:test";
import {
  MAINTENANCE_NOTE_LIMIT,
  SESSION_TEXT_LIMITS,
  validateMaintenanceInput,
  validateSessionInput,
} from "./admin-validation.ts";

const validSession = {
  courseName: "Software Engineering",
  courseId: "software-engineering",
  type: "section",
  week: "W1",
  day: "sat",
  start: "09:00",
  end: "10:00",
  instructor: "Eng. Test",
  room: "R1",
  sections: [1, 2],
};

test("accepts a valid session", () => {
  const result = validateSessionInput(validSession);

  assert.equal(result.ok, true);
});

test("rejects an oversized course name", () => {
  const result = validateSessionInput({
    ...validSession,
    courseName: "x".repeat(SESSION_TEXT_LIMITS.courseName + 1),
  });

  assert.equal(result.ok, false);
});

test("rejects an oversized course id", () => {
  const result = validateSessionInput({
    ...validSession,
    courseId: "x".repeat(SESSION_TEXT_LIMITS.courseId + 1),
  });

  assert.equal(result.ok, false);
});

test("rejects an oversized instructor", () => {
  const result = validateSessionInput({
    ...validSession,
    instructor: "x".repeat(SESSION_TEXT_LIMITS.instructor + 1),
  });

  assert.equal(result.ok, false);
});

test("rejects an oversized room", () => {
  const result = validateSessionInput({
    ...validSession,
    room: "x".repeat(SESSION_TEXT_LIMITS.room + 1),
  });

  assert.equal(result.ok, false);
});

test("rejects an oversized maintenance room", () => {
  const result = validateMaintenanceInput({
    day: "sat",
    room: "x".repeat(SESSION_TEXT_LIMITS.room + 1),
  });

  assert.equal(result.ok, false);
});

test("rejects an oversized maintenance note", () => {
  const result = validateMaintenanceInput({
    day: "sat",
    room: "R1",
    note: "x".repeat(MAINTENANCE_NOTE_LIMIT + 1),
  });

  assert.equal(result.ok, false);
});
