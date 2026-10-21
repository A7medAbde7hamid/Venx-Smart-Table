"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

async function clearServiceWorkerCaches(): Promise<void> {
  if (typeof caches === "undefined") return;

  const keys = await caches.keys();
  await Promise.all(keys.map((key) => caches.delete(key)));
}

export function AdminLogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setPending(true);
    setError(null);

    try {
      await clearServiceWorkerCaches().catch(() => {});

      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (!response.ok) throw new Error("Logout failed");

      router.replace("/admin/login");
      router.refresh();
    } catch {
      setError("تعذر تسجيل الخروج. حاول تاني.");
      setPending(false);
    }
  };

  return (
    <>
      {error && (
        <span
          role="alert"
          className="text-xs font-medium text-rose-600 dark:text-rose-300"
        >
          {error}
        </span>
      )}
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
    </>
  );
}
