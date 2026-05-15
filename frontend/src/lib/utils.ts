import { ReflectionResponse } from "./api";

export function getISOWeekNumber(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

export function getWeekBounds(year: number, isoWeek: number): { dateFrom: string; dateTo: string } {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4.getTime() - (jan4Day - 1) * 86400000);
  const monday = new Date(week1Monday.getTime() + (isoWeek - 1) * 7 * 86400000);
  const sunday = new Date(monday.getTime() + 6 * 86400000);
  return {
    dateFrom: monday.toISOString().slice(0, 10),
    dateTo: sunday.toISOString().slice(0, 10),
  };
}

export function getMonthBounds(year: number, month: number): { dateFrom: string; dateTo: string } {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const mm = String(month + 1).padStart(2, "0");
  return {
    dateFrom: `${year}-${mm}-01`,
    dateTo: `${year}-${mm}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function formatWeekLabel(dateFrom: string, dateTo: string, weekNum: number): string {
  const from = new Date(dateFrom + "T00:00:00");
  const to = new Date(dateTo + "T00:00:00");
  const monthName = from.toLocaleDateString("en-US", { month: "short" });
  return `W${weekNum} · ${monthName} ${from.getDate()}–${to.getDate()}`;
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export interface DateGroup {
  date: string;
  label: string;
  reflections: ReflectionResponse[];
}

export function groupReflectionsByDate(reflections: ReflectionResponse[]): DateGroup[] {
  const map = new Map<string, ReflectionResponse[]>();
  for (const r of reflections) {
    const list = map.get(r.date) ?? [];
    list.push(r);
    map.set(r.date, list);
  }

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, refs]) => ({
      date,
      label: formatRelativeDate(date, todayStr, yesterdayStr),
      reflections: refs,
    }));
}

function formatRelativeDate(dateStr: string, todayStr: string, yesterdayStr: string): string {
  if (dateStr === todayStr) return "Today";
  if (dateStr === yesterdayStr) return "Yesterday";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
