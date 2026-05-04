"use client";

import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { ReflectionResponse, FileResponse } from "@/lib/api";
import { groupReflectionsByDate, DateGroup } from "@/lib/utils";
import MentionDropdown from "./MentionDropdown";

interface SelectOption {
  value: string;
  label: string;
}

interface ChatInputProps {
  onSend: (message: string, files: File[]) => void;
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
  libraryFiles: FileResponse[];
  attachedFileIds: string[];
  onToggleFileId: (id: string) => void;
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ChatInput({ onSend, disabled, models, selectedModel, onModelChange, prompts, selectedPrompt, onPromptChange, attachedReflections, onRemoveAttachmentsByDate, allReflections, onAttachByDate, libraryFiles, attachedFileIds, onToggleFileId }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [mentionMode, setMentionMode] = useState<"@" | "/" | null>(null);
  const [mentionFilter, setMentionFilter] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [plusSubMenu, setPlusSubMenu] = useState<"prompts" | "notes" | "library" | null>(null);
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

    let triggerPos = -1;
    for (let i = pos - 1; i >= 0; i--) {
      if (val[i] === "@" || val[i] === "/") {
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
    onSend(message, pendingFiles);
    setPendingFiles([]);
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      setPendingFiles((prev) => [...prev, ...files]);
    }
    e.target.value = "";
  }

  function removePendingFile(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  const attachmentsByDate = groupByDate(attachedReflections);
  const hasChips = attachedReflections.length > 0 || attachedFileIds.length > 0 || pendingFiles.length > 0;

  return (
    <div className="border-t border-gray-800 bg-gray-950 px-4 py-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Attachment chips */}
      {hasChips && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {/* Reflection chips */}
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

          {/* Library file chips */}
          {attachedFileIds.map((id) => {
            const file = libraryFiles.find((f) => f.id === id);
            if (!file) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-900/50 bg-blue-950/30 px-2.5 py-1 text-xs text-blue-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 flex-shrink-0">
                  <path d="M3 3.5A1.5 1.5 0 0 1 4.5 2h4.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12A1.5 1.5 0 0 1 13 5.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 12.5v-9Z" />
                </svg>
                <span className="max-w-[120px] truncate">{file.filename}</span>
                <button
                  onClick={() => onToggleFileId(id)}
                  className="ml-0.5 rounded text-blue-500 hover:text-blue-200"
                  aria-label={`Remove ${file.filename}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                    <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                  </svg>
                </button>
              </span>
            );
          })}

          {/* Pending (ephemeral) file chips */}
          {pendingFiles.map((f, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-900/50 bg-amber-950/30 px-2.5 py-1 text-xs text-amber-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 flex-shrink-0">
                <path fillRule="evenodd" d="M4 2a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5V6.621a1.5 1.5 0 0 0-.44-1.06L9.94 2.439A1.5 1.5 0 0 0 8.878 2H4Zm1 4.75a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 5 6.75Zm.75 2.75a.75.75 0 0 0 0 1.5h2.5a.75.75 0 0 0 0-1.5h-2.5Z" clipRule="evenodd" />
              </svg>
              <span className="max-w-[120px] truncate">{f.name}</span>
              <button
                onClick={() => removePendingFile(i)}
                className="ml-0.5 rounded text-amber-500 hover:text-amber-200"
                aria-label={`Remove ${f.name}`}
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
              <button
                onMouseEnter={() => setPlusSubMenu("library")}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                  plusSubMenu === "library" ? "bg-gray-800 text-gray-100" : "text-gray-300 hover:bg-gray-800/60"
                }`}
              >
                <span>Library</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3 w-3 text-gray-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>

            {/* Sub-list */}
            {plusSubMenu && (
              <div className="absolute left-full bottom-0 ml-1 max-h-60 min-w-[200px] overflow-y-auto rounded-xl border border-gray-800 bg-gray-900 py-1 shadow-lg">
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
                {plusSubMenu === "library" &&
                  (libraryFiles.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-gray-600">No files in library.</p>
                  ) : (
                    libraryFiles.map((f) => {
                      const isAttached = attachedFileIds.includes(f.id);
                      return (
                        <button
                          key={f.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            onToggleFileId(f.id);
                          }}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-gray-800/60 ${
                            isAttached ? "text-blue-300" : "text-gray-300"
                          }`}
                        >
                          <div className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
                            isAttached ? "border-blue-500 bg-blue-500" : "border-gray-600"
                          }`}>
                            {isAttached && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 text-white">
                                <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm">{f.filename}</p>
                            <p className="text-xs text-gray-500">{formatBytes(f.size_bytes)}</p>
                          </div>
                        </button>
                      );
                    })
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Paperclip button for ephemeral files */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-800 bg-gray-900 text-gray-400 transition hover:bg-gray-800 hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Attach file"
        title="Attach file"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
        </svg>
      </button>

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
