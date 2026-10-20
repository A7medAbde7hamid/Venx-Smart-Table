import {
  GraduationCap,
  Info,
  Route,
  ShieldCheck,
} from "lucide-react";
import { PlanForm } from "@/components/plan-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { parsePlanQuery } from "@/lib/plan-query";

interface HomePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const initial = parsePlanQuery(await searchParams);

  return (
    <div>
      <section className="mb-8 max-w-2xl">
        <Badge
          variant="violet"
          className="gap-1.5 border-white/70 bg-white/70 backdrop-blur"
        >
          <GraduationCap />
          HITU AI · جدول السكاشن
        </Badge>
        <h1 className="mt-5 text-4xl font-extrabold leading-[1.2] tracking-tight sm:text-5xl">
          خطة حضورك،{" "}
          <span className="whitespace-nowrap bg-gradient-to-l from-indigo-600 via-indigo-500 to-emerald-500 bg-clip-text text-transparent">
            على مقاسك.
          </span>
        </h1>
        <p className="mt-4 text-base leading-8 text-muted-foreground sm:text-lg">
          اختار سكشنك والأسبوع واليوم، وإحنا نلف على السكاشن البديلة
          ونختار لك المسار اللي يخليك تقضي أقل وقت في الجامعة — بشرط إن
          المعيد ما يتغيرش.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-white/70 bg-white/80 p-6 backdrop-blur-sm sm:p-8">
          <PlanForm initial={initial} />
        </Card>

        <aside className="space-y-4">
          <Card className="border-emerald-200/70 bg-emerald-50/70 p-6">
            <div className="flex items-center gap-2 text-emerald-800">
              <span className="grid size-9 place-items-center rounded-xl bg-white/80 text-emerald-600 shadow-sm">
                <ShieldCheck className="size-5" />
              </span>
              <h2 className="text-base font-bold">القاعدة الذهبية</h2>
            </div>
            <p className="mt-3 text-sm leading-7 text-emerald-900/80">
              إحنا مش بنغير المعيد. لو المادة ليها أكتر من سكشن بنفس
              المعيد، بنختار أنسب واحد ليك في الوقت.
            </p>
          </Card>

          <Card className="bg-white/80 p-6 backdrop-blur-sm">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Route className="size-5 text-primary" />
              إزاي بنحسب؟
            </h2>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              <li className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  1
                </span>
                بنجيب جدول سكشنك لليوم المختار.
              </li>
              <li className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  2
                </span>
                بنجمع كل السكاشن البديلة اللي بنفس المعيد.
              </li>
              <li className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  3
                </span>
                بنجرب كل التوليفات ونختار الأفضل حسب أولويتك.
              </li>
            </ol>
          </Card>

          <div className="flex items-start gap-2 rounded-2xl border border-indigo-100/80 bg-indigo-50/60 p-4 text-xs leading-6 text-indigo-800">
            <Info className="mt-0.5 size-4 shrink-0" />
            <span>
              البيانات الكاملة متاحة لأيام <strong>الجمعة والسبت والأربع والخميس</strong>.
              الأحد والاتنين والثلاثاء أجازة.
            </span>
          </div>
        </aside>
      </section>
    </div>
  );
}
