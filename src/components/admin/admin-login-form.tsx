"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, LockKeyhole } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const inputClassName =
  "h-11 w-full rounded-xl border border-border bg-white/85 px-3 text-sm font-medium text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/[0.06] dark:focus:ring-primary/20";

export function AdminLoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "تعذر تسجيل الدخول.");
      }

      router.replace("/admin");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "تعذر تسجيل الدخول.",
      );
      setPending(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md p-6 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-emerald-900/20">
          <LockKeyhole className="size-5" />
        </span>
        <Badge variant="accent">Admin</Badge>
      </div>

      <h1 className="mt-5 text-2xl font-extrabold tracking-tight">
        دخول لوحة التحكم
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        اكتب كلمة مرور الأدمن عشان تقدر تعدل الجدول وتدير الصيانة.
      </p>

      {!configured && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            متغير <code className="font-bold">ADMIN_PASSWORD</code> غير مضبوط.
            أضفه في <code className="font-bold">.env.local</code> ثم أعد تشغيل
            السيرفر.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="space-y-2">
          <label htmlFor="admin-password" className="text-sm font-semibold">
            كلمة المرور
          </label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className={inputClassName}
            disabled={!configured || pending}
            required
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
          >
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!configured || pending}
        >
          {pending ? "بندخل..." : "دخول"}
          {!pending && <ArrowLeft />}
        </Button>
      </form>

      <Link
        href="/"
        className="mt-4 inline-flex text-xs font-semibold text-muted-foreground transition hover:text-foreground"
      >
        رجوع للموقع
      </Link>
    </Card>
  );
}
