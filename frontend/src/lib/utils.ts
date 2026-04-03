import { ReflectionResponse } from "./api";

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
