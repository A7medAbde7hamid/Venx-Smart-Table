import { NextResponse } from "next/server";
import {
  findSessionConflict,
  validateSessionInput,
} from "@/lib/admin-validation";
import { updateTimetable } from "@/lib/timetable";
import type { Session } from "@/lib/types";

export const runtime = "nodejs";

const NOT_FOUND = "SESSION_NOT_FOUND";
const CONFLICT = "SESSION_CONFLICT";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const validation = validateSessionInput(body);

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const session: Session = { id, ...validation.value };

  try {
    const timetable = await updateTimetable((data) => {
      const index = data.sessions.findIndex((item) => item.id === id);
      if (index === -1) throw new Error(NOT_FOUND);
      if (findSessionConflict(data.sessions, validation.value, id)) {
        throw new Error(CONFLICT);
      }
      data.sessions[index] = session;
    });

    return NextResponse.json({
      ok: true,
      session,
      total: timetable.sessions.length,
    });
  } catch (error) {
    if (error instanceof Error && error.message === NOT_FOUND) {
      return NextResponse.json(
        { error: "الحصة غير موجودة." },
        { status: 404 },
      );
    }
    if (error instanceof Error && error.message === CONFLICT) {
      return NextResponse.json(
        { error: "فيه تعارض مع حصة تانية لنفس السكشن في نفس الوقت." },
        { status: 409 },
      );
    }
    throw error;
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const timetable = await updateTimetable((data) => {
      const index = data.sessions.findIndex((item) => item.id === id);
      if (index === -1) throw new Error(NOT_FOUND);
      data.sessions.splice(index, 1);
    });

    return NextResponse.json({
      ok: true,
      total: timetable.sessions.length,
    });
  } catch (error) {
    if (error instanceof Error && error.message === NOT_FOUND) {
      return NextResponse.json(
        { error: "الحصة غير موجودة." },
        { status: 404 },
      );
    }
    throw error;
  }
}
