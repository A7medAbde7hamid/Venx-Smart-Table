import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import {
  ADMIN_COOKIE_NAME,
  isValidAdminToken,
} from "@/lib/admin-auth";
import { readTimetable } from "@/lib/timetable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "لوحة التحكم",
};

export default async function AdminPage() {
  const token = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;

  if (!(await isValidAdminToken(token))) {
    redirect("/admin/login");
  }

  const timetable = await readTimetable();

  return <AdminDashboard initialTimetable={timetable} />;
}
