import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { readTimetable } from "@/lib/timetable";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timetable = await readTimetable();

  return NextResponse.json(timetable, {
    headers: { "Cache-Control": "no-store" },
  });
}
