import { promises as fs } from "node:fs";
import path from "node:path";
import type { Timetable } from "./types";

const TIMETABLE_PATH = path.join(process.cwd(), "data", "timetable.json");
let writeQueue: Promise<unknown> = Promise.resolve();

export async function readTimetable(): Promise<Timetable> {
  const raw = await fs.readFile(TIMETABLE_PATH, "utf8");
  const parsed = JSON.parse(raw) as Partial<Timetable>;

  return {
    version: typeof parsed.version === "number" ? parsed.version : 1,
    term: typeof parsed.term === "string" ? parsed.term : "2026/2027 - Term 1",
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    maintenance: Array.isArray(parsed.maintenance) ? parsed.maintenance : [],
  };
}

async function writeTimetable(timetable: Timetable): Promise<void> {
  const temporaryPath = `${TIMETABLE_PATH}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(
    temporaryPath,
    `${JSON.stringify(timetable, null, 2)}\n`,
    "utf8",
  );
  await fs.rename(temporaryPath, TIMETABLE_PATH);
}

export function updateTimetable(
  mutate: (timetable: Timetable) => void | Promise<void>,
): Promise<Timetable> {
  const operation = writeQueue.then(async () => {
    const timetable = await readTimetable();
    await mutate(timetable);
    await writeTimetable(timetable);
    return timetable;
  });

  writeQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}
