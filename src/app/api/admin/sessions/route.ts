import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  createSessionId,
  findSessionConflict,
  validateSessionInput,
} from "@/lib/admin-validation";
import { readJsonBody } from "@/lib/request-body";
import { updateTimetable } from "@/lib/timetable";
import type { Session } from "@/lib/types";

export const runtime = "nodejs";

const CONFLICT = "SESSION_CONFLICT";
const MAX_SESSION_BODY_BYTES = 16 * 1024;

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
