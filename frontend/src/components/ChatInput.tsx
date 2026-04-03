"use client";

import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { ReflectionResponse } from "@/lib/api";
import { groupReflectionsByDate, DateGroup } from "@/lib/utils";
import MentionDropdown from "./MentionDropdown";

interface SelectOption {
  value: string;
  label: string;
}

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  models: readonly SelectOption[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  prompts: readonly SelectOption[];
  selectedPrompt: string;
  onPromptChange: (prompt: string) => void;
  attachedReflections: ReflectionResponse[];
  onRemoveAttachmentsByDate: (date: string) => void;
  allReflections: ReflectionResponse[];
  onAttachByDate: (date: string) => void;
}

function groupByDate(reflections: ReflectionResponse[]): Map<string, ReflectionResponse[]> {
  const map = new Map<string, ReflectionResponse[]>();
  for (const r of reflections) {
    const list = map.get(r.date) ?? [];
    list.push(r);
    map.set(r.date, list);
  }
  return map;
}

function formatChipDate(dateStr: string): string {
  const today = new Date();
  const date = new Date(dateStr + "T00:00:00");
  const todayStr = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (dateStr === todayStr) return "Today";
  if (dateStr === yesterdayStr) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function ChatInput({ onSend, disabled, models, selectedModel, onModelChange, prompts, selectedPrompt, onPromptChange, attachedReflections, onRemoveAttachmentsByDate, allReflections, onAttachByDate }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionMode, setMentionMode] = useState<"@" | "/" | null>(null);
  const [mentionFilter, setMentionFilter] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [plusSubMenu, setPlusSubMenu] = useState<"prompts" | "notes" | null>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);

  const dateGroups: DateGroup[] = groupReflectionsByDate(allReflections);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!plusMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setPlusMenuOpen(false);
        setPlusSubMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [plusMenuOpen]);

  function adjustHeight() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = 24;
    const maxHeight = lineHeight * 4;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }

  function detectMention() {
    const el = textareaRef.current;
    if (!el) return;
    const val = el.value;
    const pos = el.selectionStart;

    // Find the trigger character before cursor
    let triggerPos = -1;
    for (let i = pos - 1; i >= 0; i--) {
      if (val[i] === "@" || val[i] === "/") {
        // Must be at start or preceded by whitespace
        if (i === 0 || /\s/.test(val[i - 1])) {
          triggerPos = i;
        }
        break;
      }
      if (/\s/.test(val[i])) break;
    }

    if (triggerPos >= 0) {
      const trigger = val[triggerPos] as "@" | "/";
      const filter = val.slice(triggerPos + 1, pos);
      if (mentionMode !== trigger || mentionFilter !== filter) {
        setMentionMode(trigger);
        setMentionFilter(filter);
        setMentionStartPos(triggerPos);
        setMentionIndex(0);
      }
    } else if (mentionMode !== null) {
      closeMention();
    }
  }

  function closeMention() {
    setMentionMode(null);
    setMentionFilter("");
    setMentionIndex(0);
  }

  function getFilteredItemCount(): number {
    if (mentionMode === "@") {
      return dateGroups.filter(
        (g) =>
          g.label.toLowerCase().includes(mentionFilter.toLowerCase()) ||
          g.date.includes(mentionFilter)
      ).length;
    }
    if (mentionMode === "/") {
      return prompts.filter((p) =>
        p.label.toLowerCase().includes(mentionFilter.toLowerCase())
      ).length;
    }
    return 0;
  }

  function handleMentionSelect(index: number) {
    const el = textareaRef.current;
    if (!el) return;

    if (mentionMode === "@") {
      const filtered = dateGroups.filter(
        (g) =>
          g.label.toLowerCase().includes(mentionFilter.toLowerCase()) ||
          g.date.includes(mentionFilter)
      );
      const selected = filtered[index];
      if (selected) {
        onAttachByDate(selected.date);
      }
    } else if (mentionMode === "/") {
      const filtered = prompts.filter((p) =>
        p.label.toLowerCase().includes(mentionFilter.toLowerCase())
      );
      const selected = filtered[index];
      if (selected) {
        onPromptChange(selected.value);
      }
    }

    // Remove trigger text from textarea
    const val = el.value;
    const cursorPos = el.selectionStart;
    el.value = val.slice(0, mentionStartPos) + val.slice(cursorPos);
    el.selectionStart = el.selectionEnd = mentionStartPos;
    adjustHeight();
    closeMention();
    el.focus();
  }

  function handleChange() {
    adjustHeight();
    detectMention();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionMode) {
      const count = getFilteredItemCount();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((prev) => Math.min(prev + 1, count - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((prev) => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (count > 0) {
          handleMentionSelect(mentionIndex);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        closeMention();
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  }

  function submitMessage() {
    const el = textareaRef.current;
    if (!el) return;
    const message = el.value.trim();
    if (!message || disabled) return;
    el.value = "";
    el.style.height = "auto";
    closeMention();
    onSend(message);
  }

  const attachmentsByDate = groupByDate(attachedReflections);

  return (
    <div className="border-t border-gray-800 bg-gray-950 px-4 py-3">
      {/* Attachment chips */}
      {attachedReflections.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {[...attachmentsByDate.entries()].map(([date, refs]) => (
            <span
              key={date}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-800 bg-gray-900 px-2.5 py-1 text-xs text-gray-300"
            >
              <span>
                {formatChipDate(date)} — {refs.map((r) => capitalizeFirst(r.reflection_type)).join(", ")}
              </span>
              <button
                onClick={() => onRemoveAttachmentsByDate(date)}
                className="ml-0.5 rounded text-gray-500 hover:text-gray-300"
                aria-label={`Remove ${date} reflections`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                  <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
      {/* + button with flyout menu */}
      <div ref={plusMenuRef} className="relative flex-shrink-0">
        <button
          onClick={() => { setPlusMenuOpen(!plusMenuOpen); setPlusSubMenu(null); }}
          disabled={disabled}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-800 bg-gray-900 text-gray-400 transition hover:bg-gray-800 hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Attach content"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>

        {plusMenuOpen && (
          <div className="absolute bottom-full left-0 z-50 mb-1">
            {/* Categories */}
            <div className="relative rounded-xl border border-gray-800 bg-gray-900 py-1 shadow-lg">
              <button
                onMouseEnter={() => setPlusSubMenu("prompts")}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                  plusSubMenu === "prompts" ? "bg-gray-800 text-gray-100" : "text-gray-300 hover:bg-gray-800/60"
                }`}
              >
                <span>System Prompts</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3 w-3 text-gray-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              <button
                onMouseEnter={() => setPlusSubMenu("notes")}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                  plusSubMenu === "notes" ? "bg-gray-800 text-gray-100" : "text-gray-300 hover:bg-gray-800/60"
                }`}
              >
                <span>Notes</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3 w-3 text-gray-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>

            {/* Sub-list */}
            {plusSubMenu && (
              <div className="absolute left-full bottom-0 ml-1 max-h-60 min-w-[180px] overflow-y-auto rounded-xl border border-gray-800 bg-gray-900 py-1 shadow-lg">
                {plusSubMenu === "prompts" &&
                  prompts.map((p) => (
                    <button
                      key={p.value}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onPromptChange(p.value);
                        setPlusMenuOpen(false);
                        setPlusSubMenu(null);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-300 transition hover:bg-gray-800/60"
                    >
                      {p.label}
                    </button>
                  ))}
                {plusSubMenu === "notes" &&
                  (dateGroups.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-gray-600">No reflections yet.</p>
                  ) : (
                    dateGroups.map((g) => (
                      <button
                        key={g.date}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          onAttachByDate(g.date);
                          setPlusMenuOpen(false);
                          setPlusSubMenu(null);
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-gray-300 transition hover:bg-gray-800/60"
                      >
                        <span>{g.label}</span>
                        <span className="text-xs text-gray-500">{g.reflections.length}</span>
                      </button>
                    ))
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative flex-1">
        {mentionMode && (
          <MentionDropdown
            mode={mentionMode}
            filter={mentionFilter}
            activeIndex={mentionIndex}
            dateGroups={dateGroups}
            prompts={prompts}
            onSelect={handleMentionSelect}
            onClose={closeMention}
          />
        )}
        <textarea
          ref={textareaRef}
          rows={1}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Type a message... (@ for reflections, / for prompts)"
          className="w-full resize-none rounded-xl border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none transition focus:border-gray-600 focus:ring-2 focus:ring-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ minHeight: "40px", maxHeight: "96px", overflowY: "auto" }}
        />
      </div>
      <select
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        disabled={disabled}
        className="h-10 flex-shrink-0 rounded-xl border border-gray-800 bg-gray-900 px-2 text-sm text-gray-100 outline-none transition focus:border-gray-600 focus:ring-2 focus:ring-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {models.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      <button
        onClick={submitMessage}
        disabled={disabled}
        aria-label="Send message"
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-900 transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
        >
          <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
        </svg>
      </button>
      </div>
    </div>
  );
}
