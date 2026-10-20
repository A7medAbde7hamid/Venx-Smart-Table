import { NextResponse } from "next/server";
import { readTimetable } from "@/lib/timetable";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const timetable = await readTimetable();

  return NextResponse.json(timetable, {
    headers: { "Cache-Control": "no-store" },
  });
}
