import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  findSessionConflict,
  validateSessionInput,
} from "@/lib/admin-validation";
import { readJsonBody } from "@/lib/request-body";
import { updateTimetable } from "@/lib/timetable";
import type { Session } from "@/lib/types";

export const runtime = "nodejs";

const NOT_FOUND = "SESSION_NOT_FOUND";
const CONFLICT = "SESSION_CONFLICT";
const MAX_SESSION_BODY_BYTES = 16 * 1024;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await readJsonBody(request, MAX_SESSION_BODY_BYTES);

  if (!body.ok) {
    return NextResponse.json(
      {
        error:
          body.reason === "too_large"
            ? "الطلب كبير جدًا."
            : "بيانات الحصة غير صالحة.",
      },
      { status: body.reason === "too_large" ? 413 : 400 },
    );
  }

  const validation = validateSessionInput(body.value);

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

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
