"use client";

import { useEffect, useRef, useState } from "react";
import { PeriodicReflectionResponse, PeriodicReflectionType } from "@/lib/api";
import { getISOWeekNumber, getWeekBounds, getMonthBounds, formatWeekLabel } from "@/lib/utils";

interface NewPeriodicDropdownProps {
  periodicReflections: PeriodicReflectionResponse[];
  onSelect: (type: PeriodicReflectionType, dateFrom: string, dateTo: string, existingId?: string) => void;
  onClose: () => void;
}

function findExisting(
  reflections: PeriodicReflectionResponse[],
  type: PeriodicReflectionType,
  dateFrom: string,
  dateTo: string,
): PeriodicReflectionResponse | undefined {
  return reflections.find((r) => r.reflection_type === type && r.date_from === dateFrom && r.date_to === dateTo);
}

function isWeekBased(type: PeriodicReflectionType): boolean {
  return type === "weekly" || type === "weekly_plan";
}

export default function NewPeriodicDropdown({ periodicReflections, onSelect, onClose }: NewPeriodicDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [showOther, setShowOther] = useState(false);
  const [otherType, setOtherType] = useState<PeriodicReflectionType>("weekly");
  const [otherWeekInput, setOtherWeekInput] = useState("");
  const [otherMonthInput, setOtherMonthInput] = useState("");

  const today = new Date();
  const { year: curWeekYear, week: curWeekNum } = getISOWeekNumber(today);
  const curWeekBounds = getWeekBounds(curWeekYear, curWeekNum);
  const curMonthBounds = getMonthBounds(today.getFullYear(), today.getMonth());
  const curWeekLabel = formatWeekLabel(curWeekBounds.dateFrom, curWeekBounds.dateTo, curWeekNum);
  const curMonthLabel = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  function handleSelect(type: PeriodicReflectionType, dateFrom: string, dateTo: string) {
    const existing = findExisting(periodicReflections, type, dateFrom, dateTo);
    onSelect(type, dateFrom, dateTo, existing?.id);
  }

  function handleOtherGo() {
    if (isWeekBased(otherType) && otherWeekInput) {
      const [y, , w] = otherWeekInput.split(/[-W]/).map(Number);
      const bounds = getWeekBounds(y, w);
      handleSelect(otherType, bounds.dateFrom, bounds.dateTo);
    } else if (!isWeekBased(otherType) && otherMonthInput) {
      const [y, m] = otherMonthInput.split("-").map(Number);
      const bounds = getMonthBounds(y, m - 1);
      handleSelect(otherType, bounds.dateFrom, bounds.dateTo);
    }
  }

  const typeOptions: { value: PeriodicReflectionType; label: string }[] = [
    { value: "weekly", label: "Weekly" },
    { value: "weekly_plan", label: "Weekly Plan" },
    { value: "monthly", label: "Monthly" },
    { value: "monthly_plan", label: "Monthly Plan" },
  ];

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 z-50 mt-2 w-72 rounded-xl border border-gray-800 bg-gray-900 py-1 shadow-xl"
    >
      {!showOther ? (
        <>
          <button
            onClick={() => handleSelect("weekly", curWeekBounds.dateFrom, curWeekBounds.dateTo)}
            className="flex w-[calc(100%-8px)] items-center justify-between rounded-lg mx-1 px-3 py-2.5 text-left hover:bg-gray-800 transition"
          >
            <span className="text-sm font-medium text-gray-200">Weekly</span>
            <span className="text-xs text-gray-500">{curWeekLabel}</span>
          </button>
          <button
            onClick={() => handleSelect("weekly_plan", curWeekBounds.dateFrom, curWeekBounds.dateTo)}
            className="flex w-[calc(100%-8px)] items-center justify-between rounded-lg mx-1 px-3 py-2.5 text-left hover:bg-gray-800 transition"
          >
            <span className="text-sm font-medium text-purple-300">Weekly Plan</span>
            <span className="text-xs text-gray-500">{curWeekLabel}</span>
          </button>
          <button
            onClick={() => handleSelect("monthly", curMonthBounds.dateFrom, curMonthBounds.dateTo)}
            className="flex w-[calc(100%-8px)] items-center justify-between rounded-lg mx-1 px-3 py-2.5 text-left hover:bg-gray-800 transition"
          >
            <span className="text-sm font-medium text-gray-200">Monthly</span>
            <span className="text-xs text-gray-500">{curMonthLabel}</span>
          </button>
          <button
            onClick={() => handleSelect("monthly_plan", curMonthBounds.dateFrom, curMonthBounds.dateTo)}
            className="flex w-[calc(100%-8px)] items-center justify-between rounded-lg mx-1 px-3 py-2.5 text-left hover:bg-gray-800 transition"
          >
            <span className="text-sm font-medium text-purple-300">Monthly Plan</span>
            <span className="text-xs text-gray-500">{curMonthLabel}</span>
          </button>
          <div className="my-1 border-t border-gray-800" />
          <button
            onClick={() => setShowOther(true)}
            className="flex w-[calc(100%-8px)] items-center justify-between rounded-lg mx-1 px-3 py-2 text-left hover:bg-gray-800 transition"
          >
            <span className="text-sm text-gray-400">Other period</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-gray-600">
              <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
        </>
      ) : (
        <div className="px-3 py-2 space-y-3">
          <button onClick={() => setShowOther(false)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
              <path fillRule="evenodd" d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L5.47 8.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
            </svg>
            Other period
          </button>

          <div className="grid grid-cols-2 gap-2">
            {typeOptions.map((opt) => {
              const isPlan = opt.value === "weekly_plan" || opt.value === "monthly_plan";
              const isActive = otherType === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setOtherType(opt.value)}
                  className={`rounded-lg py-1.5 text-xs font-medium transition ${
                    isActive
                      ? isPlan ? "bg-purple-900/40 text-purple-200" : "bg-gray-700 text-gray-100"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {isWeekBased(otherType) ? (
            <div>
              <label className="mb-1 block text-xs text-gray-500">Week</label>
              <input
                type="week"
                value={otherWeekInput}
                onChange={(e) => setOtherWeekInput(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs text-gray-500">Month</label>
              <input
                type="month"
                value={otherMonthInput}
                onChange={(e) => setOtherMonthInput(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}

          <button
            onClick={handleOtherGo}
            disabled={isWeekBased(otherType) ? !otherWeekInput : !otherMonthInput}
            className="w-full rounded-lg bg-blue-600 py-1.5 text-sm font-medium text-white hover:bg-blue-500 transition disabled:opacity-40"
          >
            Go
          </button>
        </div>
      )}
    </div>
  );
}
