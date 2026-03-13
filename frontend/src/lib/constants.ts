export const API_BASE_URL = "http://localhost:8000";

export const USER_ID = process.env.NEXT_PUBLIC_USER_ID!;

export const MODELS = [
  { value: "claude-haiku-4-5-20251001", label: "Haiku" },
  { value: "claude-sonnet-4-20250514", label: "Sonnet" },
] as const;

export const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

export const PROMPTS = [
  { value: "free_chat", label: "Free Chat" },
  { value: "morning_reflection", label: "Morning Reflection" },
] as const;

export const DEFAULT_PROMPT = "free_chat";

export const PROMPT_META: Record<
  string,
  { label: string; emoji: string; description: string }
> = {
  morning_reflection: {
    label: "Morning Reflection",
    emoji: "🌅",
    description:
      "Start your day with a guided reflection. Share how you are feeling, what is on your mind, or what you want to focus on today.",
  },
  free_chat: {
    label: "Free Chat",
    emoji: "💬",
    description:
      "Open conversation with no specific prompt. Ask anything, think out loud, or just explore your thoughts.",
  },
};
