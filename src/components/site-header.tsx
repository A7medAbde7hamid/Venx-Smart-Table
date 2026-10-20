import Link from "next/link";
import { GraduationCap, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-indigo-500/25 transition-transform group-hover:-rotate-3">
            <Sparkles className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-base font-extrabold">جدولي</span>
            <span className="block text-[11px] text-muted-foreground">
              HITU AI · Smart Table
            </span>
          </span>
        </Link>
        <Badge
          variant="outline"
          className="hidden gap-1.5 bg-white/70 sm:inline-flex"
        >
          <GraduationCap />
          تكنولوجيا الذكاء الاصطناعي
        </Badge>
      </div>
    </header>
  );
}
