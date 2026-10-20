import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "دخول الأدمن",
};

export default function AdminLoginPage() {
  return (
    <div className="py-6 sm:py-12">
      <AdminLoginForm configured={Boolean(process.env.ADMIN_PASSWORD?.trim())} />
    </div>
  );
}
