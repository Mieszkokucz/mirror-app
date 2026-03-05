import { PromptType } from "./api";
import { PROMPT_META } from "./constants";

export interface SessionEntry {
  id: string;
  label: string;
  promptType: PromptType;
  createdAt: string; // ISO date string
}

const STORAGE_KEY = "mirror_sessions";

export function loadSessions(): SessionEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SessionEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveSession(entry: SessionEntry): SessionEntry[] {
  if (typeof window === "undefined") return [];
  const sessions = loadSessions();
  const filtered = sessions.filter((s) => s.id !== entry.id);
  const updated = [entry, ...filtered];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function buildLabel(promptType: PromptType, createdAt: string): string {
  const date = new Date(createdAt);
  const formatted = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const key = promptType ?? "free_chat";
  const prefix = PROMPT_META[key]?.label ?? "Chat";
  return `${prefix} — ${formatted}`;
}
