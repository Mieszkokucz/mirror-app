import { API_BASE_URL } from "./constants";

export type PromptType = "morning_reflection" | null;

export interface ChatRequest {
  message: string;
  session_id?: string | null;
  prompt?: PromptType;
}

export interface ChatResponse {
  response: string;
  session_id: string;
}

export async function sendChatMessage(req: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE_URL}/chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<ChatResponse>;
}
