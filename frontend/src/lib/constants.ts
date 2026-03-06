export const API_BASE_URL = "http://localhost:8000";

export const USER_ID = "b2769e58-414b-4d6e-b7b2-643db1616bda";

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
