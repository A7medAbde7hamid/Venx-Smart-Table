import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  createMaintenanceId,
  roomKey,
  validateMaintenanceInput,
} from "@/lib/admin-validation";
import { storageErrorResponse } from "@/lib/api-errors";
import { readJsonBody } from "@/lib/request-body";
import { updateTimetable } from "@/lib/timetable";

export const runtime = "nodejs";

const MAX_MAINTENANCE_BODY_BYTES = 16 * 1024;

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await readJsonBody(request, MAX_MAINTENANCE_BODY_BYTES);

  if (!body.ok) {
    return NextResponse.json(
      {
        error:
          body.reason === "too_large"
            ? "الطلب كبير جدًا."
            : "بيانات الصيانة غير صالحة.",
      },
      { status: body.reason === "too_large" ? 413 : 400 },
    );
  }

  const validation = validateMaintenanceInput(body.value);

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { day, room, note } = validation.value;
  let action: "added" | "removed" = "added";

  try {
    const timetable = await updateTimetable((data) => {
      const index = data.maintenance.findIndex(
        (window) =>
          window.day === day && roomKey(window.room) === roomKey(room),
      );

      if (index >= 0) {
        data.maintenance.splice(index, 1);
        action = "removed";
        return;
      }

      data.maintenance.push({
        id: createMaintenanceId(),
        day,
        room,
        note,
      });
    });

    return NextResponse.json({
      ok: true,
      action,
      maintenance: timetable.maintenance,
    });
  } catch (error) {
    return storageErrorResponse(
      error,
      "تعذر حفظ حالة القاعة. حاول مرة أخرى.",
    );
  }
}
