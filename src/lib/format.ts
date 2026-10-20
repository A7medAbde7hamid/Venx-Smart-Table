const hoursLabel = (hours: number): string => {
  if (hours === 1) return "ساعة";
  if (hours === 2) return "ساعتين";
  return `${hours} ساعات`;
};

const minutesLabel = (minutes: number): string => {
  if (minutes === 1) return "دقيقة";
  if (minutes === 2) return "دقيقتين";
  return `${minutes} دقيقة`;
};

export function formatDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0 دقيقة";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return minutesLabel(minutes);
  if (minutes === 0) return hoursLabel(hours);
  return `${hoursLabel(hours)} و${minutesLabel(minutes)}`;
}

export function formatClock(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours < 12 ? "ص" : "م";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function formatSections(sections: number[]): string {
  if (sections.length <= 1) return `سكشن ${sections[0] ?? "-"}`;
  return `سكاشن ${sections[0]}–${sections[sections.length - 1]}`;
}

export function formatSessionCount(count: number): string {
  if (count === 1) return "حصة واحدة";
  if (count === 2) return "حصتين";
  return `${count} حصص`;
}

export function formatChangeCount(count: number): string {
  if (count === 0) return "مفيش تبديل";
  if (count === 1) return "تبديل واحد";
  if (count === 2) return "تبديلين";
  return `${count} تبديلات`;
}
