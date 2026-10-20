import { NextResponse } from "next/server";
import {
  createMaintenanceId,
  roomKey,
  validateMaintenanceInput,
} from "@/lib/admin-validation";
import { updateTimetable } from "@/lib/timetable";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const validation = validateMaintenanceInput(body);

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { day, room, note } = validation.value;
  let action: "added" | "removed" = "added";

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
}
