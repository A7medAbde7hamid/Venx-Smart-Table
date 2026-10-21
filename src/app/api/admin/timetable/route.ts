import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { storageErrorResponse } from "@/lib/api-errors";
import { readTimetable } from "@/lib/timetable";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const timetable = await readTimetable();

    return NextResponse.json(timetable, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return storageErrorResponse(
      error,
      "تعذر تحميل بيانات الجدول. حاول مرة أخرى.",
    );
  }
}
