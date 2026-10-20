import { NextResponse } from "next/server";
import {
  createSessionId,
  findSessionConflict,
  validateSessionInput,
} from "@/lib/admin-validation";
import { updateTimetable } from "@/lib/timetable";
import type { Session } from "@/lib/types";

export const runtime = "nodejs";

const CONFLICT = "SESSION_CONFLICT";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const validation = validateSessionInput(body);

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const session: Session = {
    id: createSessionId(validation.value),
    ...validation.value,
  };

  try {
    const timetable = await updateTimetable((data) => {
      if (findSessionConflict(data.sessions, validation.value)) {
        throw new Error(CONFLICT);
      }
      data.sessions.push(session);
    });

    return NextResponse.json(
      { ok: true, session, total: timetable.sessions.length },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === CONFLICT) {
      return NextResponse.json(
        { error: "فيه تعارض مع حصة تانية لنفس السكشن في نفس الوقت." },
        { status: 409 },
      );
    }
    throw error;
  }
}
