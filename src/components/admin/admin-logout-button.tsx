"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminLogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleLogout = async () => {
    setPending(true);

    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={pending}
    >
      <LogOut />
      {pending ? "بنخرج..." : "خروج"}
    </Button>
  );
}
