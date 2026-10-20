"use client";

import { useState, type FormEvent } from "react";
import { CalendarClock, Trash2, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DAYS, dayLabel } from "@/lib/plan-query";
import type { Day, MaintenanceWindow } from "@/lib/types";

interface MaintenanceCardProps {
  maintenance: MaintenanceWindow[];
  rooms: string[];
  busy: boolean;
  onToggle: (day: Day, room: string) => Promise<void>;
}

const selectClassName =
  "h-11 w-full cursor-pointer rounded-xl border border-border bg-white/85 px-3 text-sm font-medium text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-white/[0.06] dark:focus:ring-primary/20";

export function MaintenanceCard({
  maintenance,
  rooms,
  busy,
  onToggle,
}: MaintenanceCardProps) {
  const [day, setDay] = useState<Day>("sat");
  const [room, setRoom] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!room || busy || pending) return;

    setPending(true);

    try {
      await onToggle(day, room);
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <Wrench className="size-5 text-primary" />
            صيانة القاعات
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            أي حصة في القاعة المختارة خلال اليوم ده هتتشال من خطط الطلاب.
          </p>
        </div>
        <Badge variant="warning">{maintenance.length} تحت الصيانة</Badge>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div className="space-y-2">
          <label htmlFor="maintenance-day" className="text-xs font-semibold">
            اليوم
          </label>
          <select
            id="maintenance-day"
            value={day}
            onChange={(event) => setDay(event.target.value as Day)}
            className={selectClassName}
            disabled={busy || pending}
          >
            {DAYS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="maintenance-room" className="text-xs font-semibold">
            القاعة
          </label>
          <select
            id="maintenance-room"
            value={room}
            onChange={(event) => setRoom(event.target.value)}
            className={selectClassName}
            disabled={busy || pending}
            required
          >
            <option value="">اختر القاعة</option>
            {rooms.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="submit"
          className="self-end"
          disabled={!room || busy || pending}
        >
          <Wrench />
          {pending ? "بنحفظ..." : "تعطيل القاعة"}
        </Button>
      </form>

      <div className="mt-5 space-y-2">
        {maintenance.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-secondary/40 px-3 py-4 text-center text-xs text-muted-foreground">
            مفيش قاعات تحت الصيانة حاليًا.
          </p>
        ) : (
          maintenance
            .slice()
            .sort(
              (a, b) =>
                DAYS.findIndex((item) => item.value === a.day) -
                  DAYS.findIndex((item) => item.value === b.day) ||
                a.room.localeCompare(b.room),
            )
            .map((window) => (
              <div
                key={window.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200/70 bg-amber-50/70 px-3 py-2.5 text-xs dark:border-amber-500/30 dark:bg-amber-500/10"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <CalendarClock className="size-4 shrink-0 text-amber-700 dark:text-amber-300" />
                  <span className="font-bold text-amber-900 dark:text-amber-100">
                    {window.room}
                  </span>
                  <span className="text-amber-800/70 dark:text-amber-200/70">
                    · {dayLabel(window.day)}
                  </span>
                  {window.note && (
                    <span className="truncate text-amber-800/70 dark:text-amber-200/70">
                      · {window.note}
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:text-rose-300 dark:hover:bg-rose-500/10"
                  onClick={() => void onToggle(window.day, window.room)}
                  disabled={busy || pending}
                  aria-label={`إلغاء صيانة ${window.room} يوم ${dayLabel(window.day)}`}
                >
                  <Trash2 />
                  إلغاء
                </Button>
              </div>
            ))
        )}
      </div>
    </Card>
  );
}
