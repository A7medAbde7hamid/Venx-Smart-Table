import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";
import seedData from "../../data/timetable.json";
import { StorageError } from "./storage-error";
import type { Timetable } from "./types";

const TIMETABLE_PATH = path.join(process.cwd(), "data", "timetable.json");
const TIMETABLE_KEY = "venx-smart-table:timetable:v1";
const LOCK_KEY = `${TIMETABLE_KEY}:lock`;
const LOCK_TTL_MS = 10_000;
const LOCK_RETRIES = 20;
const LOCK_RETRY_DELAY_MS = 150;

const redis = createRedisClient();
let writeQueue: Promise<unknown> = Promise.resolve();

function createRedisClient(): Redis | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (!url || !token) return null;

  return new Redis({
    url,
    token,
    automaticDeserialization: false,
  });
}

function normalizeTimetable(
  parsed: Partial<Timetable> | null | undefined,
): Timetable {
  return {
    version: typeof parsed?.version === "number" ? parsed.version : 1,
    term: typeof parsed?.term === "string" ? parsed.term : "2026/2027 - Term 1",
    sessions: Array.isArray(parsed?.sessions) ? parsed.sessions : [],
    maintenance: Array.isArray(parsed?.maintenance) ? parsed.maintenance : [],
  };
}

const seedTimetable = normalizeTimetable(seedData as Partial<Timetable>);

const cloneTimetable = (timetable: Timetable): Timetable =>
  structuredClone(timetable);

function parseTimetable(raw: string): Timetable {
  try {
    return normalizeTimetable(JSON.parse(raw) as Partial<Timetable>);
  } catch (error) {
    console.error("[timetable] invalid stored data", error);
    throw new StorageError(
      "STORAGE_INVALID_DATA",
      "بيانات الجدول المخزنة غير صالحة. تحقق من محتوى قاعدة البيانات.",
    );
  }
}

async function readRemoteTimetable(): Promise<Timetable> {
  if (!redis) {
    throw new StorageError(
      "STORAGE_NOT_CONFIGURED",
      "قاعدة البيانات غير مهيأة. أضف إعدادات Redis في Vercel.",
    );
  }

  try {
    let raw = await redis.get<string>(TIMETABLE_KEY);

    if (!raw) {
      await redis.set(TIMETABLE_KEY, JSON.stringify(seedTimetable), {
        nx: true,
      });
      raw = await redis.get<string>(TIMETABLE_KEY);
    }

    return raw ? parseTimetable(raw) : cloneTimetable(seedTimetable);
  } catch (error) {
    if (error instanceof StorageError) throw error;
    console.error("[timetable] Redis read failed", error);
    throw new StorageError(
      "STORAGE_READ_FAILED",
      "تعذر قراءة البيانات من قاعدة البيانات. تحقق من إعدادات Redis.",
    );
  }
}

async function readLocalTimetable(): Promise<Timetable> {
  try {
    const raw = await fs.readFile(TIMETABLE_PATH, "utf8");
    return parseTimetable(raw);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return cloneTimetable(seedTimetable);
    }

    console.error("[timetable] local read failed", error);
    throw new StorageError(
      "STORAGE_READ_FAILED",
      "تعذر قراءة ملف الجدول المحلي.",
    );
  }
}

async function writeLocalTimetable(timetable: Timetable): Promise<void> {
  const temporaryPath = `${TIMETABLE_PATH}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(
    temporaryPath,
    `${JSON.stringify(timetable, null, 2)}\n`,
    "utf8",
  );
  await fs.rename(temporaryPath, TIMETABLE_PATH);
}

async function writeRemoteTimetable(timetable: Timetable): Promise<void> {
  if (!redis) {
    throw new StorageError(
      "STORAGE_NOT_CONFIGURED",
      "قاعدة البيانات غير مهيأة. أضف إعدادات Redis في Vercel.",
    );
  }

  try {
    await redis.set(TIMETABLE_KEY, JSON.stringify(timetable));
  } catch (error) {
    console.error("[timetable] Redis write failed", error);
    throw new StorageError(
      "STORAGE_WRITE_FAILED",
      "تعذر حفظ التعديلات في قاعدة البيانات. تحقق من اتصال Redis.",
    );
  }
}

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function withRemoteLock<T>(operation: () => Promise<T>): Promise<T> {
  if (!redis) {
    throw new StorageError(
      "STORAGE_NOT_CONFIGURED",
      "قاعدة البيانات غير مهيأة. أضف إعدادات Redis في Vercel.",
    );
  }

  const token = randomUUID();
  let acquired = false;

  try {
    for (let attempt = 0; attempt < LOCK_RETRIES; attempt += 1) {
      const result = await redis.set(LOCK_KEY, token, {
        nx: true,
        px: LOCK_TTL_MS,
      });

      if (result === "OK") {
        acquired = true;
        break;
      }

      await wait(LOCK_RETRY_DELAY_MS);
    }
  } catch (error) {
    console.error("[timetable] Redis lock failed", error);
    throw new StorageError(
      "STORAGE_WRITE_FAILED",
      "تعذر الاتصال بقاعدة البيانات لحفظ التعديلات.",
    );
  }

  if (!acquired) {
    throw new StorageError(
      "STORAGE_BUSY",
      "هناك عملية حفظ أخرى قيد التنفيذ. حاول مرة أخرى بعد لحظات.",
    );
  }

  try {
    return await operation();
  } finally {
    try {
      await redis.eval(
        "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
        [LOCK_KEY],
        [token],
      );
    } catch (error) {
      console.error("[timetable] failed to release Redis lock", error);
    }
  }
}

export async function readTimetable(): Promise<Timetable> {
  if (redis) return readRemoteTimetable();

  if (process.env.NODE_ENV === "production") {
    return cloneTimetable(seedTimetable);
  }

  return readLocalTimetable();
}

export function updateTimetable(
  mutate: (timetable: Timetable) => void | Promise<void>,
): Promise<Timetable> {
  if (redis) {
    return withRemoteLock(async () => {
      const timetable = await readRemoteTimetable();
      await mutate(timetable);
      await writeRemoteTimetable(timetable);
      return timetable;
    });
  }

  if (process.env.NODE_ENV === "production") {
    return Promise.reject(
      new StorageError(
        "STORAGE_NOT_CONFIGURED",
        "قاعدة البيانات غير مهيأة. أضف UPSTASH_REDIS_REST_URL و UPSTASH_REDIS_REST_TOKEN في Vercel ثم أعد النشر.",
      ),
    );
  }

  const operation = writeQueue.then(async () => {
    const timetable = await readLocalTimetable();
    await mutate(timetable);
    await writeLocalTimetable(timetable);
    return timetable;
  });

  writeQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}
