"use client";

import { useEffect, useRef, KeyboardEvent } from "react";

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
  showPromptSelector: boolean;
}

export default function ChatInput({ onSend, disabled, models, selectedModel, onModelChange, prompts, selectedPrompt, onPromptChange, showPromptSelector }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  function adjustHeight() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = 24;
    const maxHeight = lineHeight * 4;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }

  function handleChange() {
    adjustHeight();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
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
    onSend(message);
  }

  return (
    <div className="flex items-end gap-2 border-t border-gray-800 bg-gray-950 px-4 py-3">
      {showPromptSelector && (
        <select
          value={selectedPrompt}
          onChange={(e) => onPromptChange(e.target.value)}
          disabled={disabled}
          className="h-10 flex-shrink-0 rounded-xl border border-gray-800 bg-gray-900 px-2 text-sm text-gray-100 outline-none transition focus:border-gray-600 focus:ring-2 focus:ring-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {prompts.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      )}
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
      <textarea
        ref={textareaRef}
        rows={1}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Type a message..."
        className="flex-1 resize-none rounded-xl border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none transition focus:border-gray-600 focus:ring-2 focus:ring-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ minHeight: "40px", maxHeight: "96px", overflowY: "auto" }}
      />
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
  );
}
