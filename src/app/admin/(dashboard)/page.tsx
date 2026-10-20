import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { readTimetable } from "@/lib/timetable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "لوحة التحكم",
};

export default async function AdminPage() {
  const timetable = await readTimetable();

  return <AdminDashboard initialTimetable={timetable} />;
}
