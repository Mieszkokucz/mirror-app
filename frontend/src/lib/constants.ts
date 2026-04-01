export const API_BASE_URL = "http://localhost:8000";

export const USER_ID = process.env.NEXT_PUBLIC_USER_ID!;

export const MODELS = [
  { value: "claude-haiku-4-5-20251001", label: "Haiku" },
  { value: "claude-sonnet-4-20250514", label: "Sonnet" },
] as const;

export const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

export const FREE_CHAT_ID = "free_chat";

export const FREE_CHAT_META = {
  label: "Free Chat",
  emoji: "💬",
  description:
    "Open conversation with no specific prompt. Ask anything, think out loud, or just explore your thoughts.",
};
