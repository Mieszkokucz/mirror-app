"use client";

import { PeriodicReflectionResponse } from "@/lib/api";
import { getISOWeekNumber, formatWeekLabel } from "@/lib/utils";

export interface TimelineGroup {
  monthKey: string;
  monthLabel: string;
  monthly: PeriodicReflectionResponse | null;
  monthlyPlan: PeriodicReflectionResponse | null;
  monthlyPlaceholder: { dateFrom: string; dateTo: string };
  weeks: PeriodicReflectionResponse[];
  weeklyPlans: PeriodicReflectionResponse[];
}

interface TimelinePanelProps {
  groups: TimelineGroup[];
  activePeriodId: string | null;
  onSelectEntry: (r: PeriodicReflectionResponse) => void;
  onSelectPlaceholder: (type: "weekly" | "monthly", dateFrom: string, dateTo: string) => void;
}

function previewText(content: string): string {
  return content.length > 80 ? content.slice(0, 80).trimEnd() + "…" : content;
}

function weekLabel(r: PeriodicReflectionResponse): string {
  const { week } = getISOWeekNumber(new Date(r.date_from + "T00:00:00"));
  return formatWeekLabel(r.date_from, r.date_to, week);
}

export default function TimelinePanel({ groups, activePeriodId, onSelectEntry, onSelectPlaceholder }: TimelinePanelProps) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 h-10 w-10 text-gray-700">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
        </svg>
        <p className="text-sm font-medium text-gray-400">No summaries yet</p>
        <p className="mt-1 text-xs text-gray-600">Click + New Reflection to start with a weekly or monthly summary.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 overflow-y-auto">
      {groups.map((group) => (
        <div key={group.monthKey}>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">{group.monthLabel}</p>
          <div className="space-y-2">
            {/* Monthly card */}
            {group.monthly ? (
              <button
                onClick={() => onSelectEntry(group.monthly!)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                  activePeriodId === group.monthly.id
                    ? "border-blue-500 bg-gray-800/60"
                    : "border-gray-800 bg-gray-900 hover:border-gray-700"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">Monthly</span>
                  <span className="text-xs text-gray-500">{group.monthLabel}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{previewText(group.monthly.content)}</p>
              </button>
            ) : (
              <button
                onClick={() => onSelectPlaceholder("monthly", group.monthlyPlaceholder.dateFrom, group.monthlyPlaceholder.dateTo)}
                className="w-full rounded-xl border border-dashed border-gray-800 bg-gray-900/50 px-3 py-2.5 text-left hover:border-gray-700 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-block rounded-full bg-gray-800/60 px-2 py-0.5 text-xs text-gray-600">Monthly</span>
                  <span className="text-xs text-gray-600">no monthly summary yet</span>
                </div>
              </button>
            )}

            {/* Monthly Plan card (only when exists) */}
            {group.monthlyPlan && (
              <button
                onClick={() => onSelectEntry(group.monthlyPlan!)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                  activePeriodId === group.monthlyPlan.id
                    ? "border-blue-500 bg-gray-800/60"
                    : "border-gray-800 bg-gray-900 hover:border-gray-700"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block rounded-full bg-purple-900/40 px-2 py-0.5 text-xs text-purple-300">Monthly Plan</span>
                  <span className="text-xs text-gray-500">{group.monthLabel}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{previewText(group.monthlyPlan.content)}</p>
              </button>
            )}

            {/* Weekly cards */}
            {group.weeks.map((r) => (
              <button
                key={r.id}
                onClick={() => onSelectEntry(r)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                  activePeriodId === r.id
                    ? "border-blue-500 bg-gray-800/60"
                    : "border-gray-800 bg-gray-900 hover:border-gray-700"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">Weekly</span>
                  <span className="text-xs text-gray-500">{weekLabel(r)}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{previewText(r.content)}</p>
              </button>
            ))}

            {/* Weekly Plan cards */}
            {group.weeklyPlans.map((r) => (
              <button
                key={r.id}
                onClick={() => onSelectEntry(r)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                  activePeriodId === r.id
                    ? "border-blue-500 bg-gray-800/60"
                    : "border-gray-800 bg-gray-900 hover:border-gray-700"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block rounded-full bg-purple-900/40 px-2 py-0.5 text-xs text-purple-300">Weekly Plan</span>
                  <span className="text-xs text-gray-500">{weekLabel(r)}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{previewText(r.content)}</p>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
