"use client";

import { useEffect, useRef } from "react";
import { DateGroup } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface MentionDropdownProps {
  mode: "@" | "/";
  filter: string;
  activeIndex: number;
  dateGroups: DateGroup[];
  prompts: readonly SelectOption[];
  onSelect: (index: number) => void;
  onClose: () => void;
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function MentionDropdown({
  mode,
  filter,
  activeIndex,
  dateGroups,
  prompts,
  onSelect,
  onClose,
}: MentionDropdownProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const items =
    mode === "@"
      ? dateGroups
          .filter(
            (g) =>
              g.label.toLowerCase().includes(filter.toLowerCase()) ||
              g.date.includes(filter)
          )
          .map((g) => ({
            key: g.date,
            primary: g.label,
            secondary: g.reflections
              .map((r) => capitalizeFirst(r.reflection_type))
              .join(", "),
          }))
      : prompts
          .filter((p) =>
            p.label.toLowerCase().includes(filter.toLowerCase())
          )
          .map((p) => ({
            key: p.value,
            primary: p.label,
            secondary: "",
          }));

  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (items.length === 0) return null;

  return (
    <div
      ref={listRef}
      className="absolute bottom-full left-0 right-0 z-50 mb-1 max-h-60 overflow-y-auto rounded-xl border border-gray-800 bg-gray-900 py-1 shadow-lg"
    >
      {items.map((item, i) => (
        <button
          key={item.key}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(i);
          }}
          className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
            i === activeIndex
              ? "bg-gray-800 text-gray-100"
              : "text-gray-300 hover:bg-gray-800/60"
          }`}
        >
          <span>{item.primary}</span>
          {item.secondary && (
            <span className="ml-2 text-xs text-gray-500">{item.secondary}</span>
          )}
        </button>
      ))}
    </div>
  );
}
