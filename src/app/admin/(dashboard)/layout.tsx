import Link from "next/link";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export default function AdminDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <Badge variant="accent" className="gap-1.5">
            <ShieldCheck />
            Admin
          </Badge>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
            لوحة التحكم
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            إدارة حصص الجدول وحالات الصيانة.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ExternalLink />
            عرض الموقع
          </Link>
          <AdminLogoutButton />
        </div>
      </header>
      {children}
    </div>
  );
}
