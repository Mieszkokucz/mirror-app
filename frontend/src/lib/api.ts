import { API_BASE_URL } from "./constants";

export type PromptType = "morning_reflection" | null;

export interface ChatRequest {
  message: string;
  session_id?: string | null;
  prompt?: PromptType;
  model?: string;
  user_id: string;
}

export interface ChatResponse {
  response: string;
  session_id: string;
}

export interface SessionResponse {
  id: string;
  updated_at: string;
}

export interface MessageResponse {
  role: string;
  content: string;
  created_at: string;
}

export interface ReflectionResponse {
  id: string;
  user_id: string;
  reflection_type: string;
  date: string;
  content: string;
  created_at: string;
  updated_at: string;
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

export async function fetchSessions(userId: string): Promise<SessionResponse[]> {
  const res = await fetch(`${API_BASE_URL}/chat/sessions?user_id=${userId}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<SessionResponse[]>;
}

export async function fetchSessionMessages(sessionId: string): Promise<MessageResponse[]> {
  const res = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/messages`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<MessageResponse[]>;
}

export interface ReflectionCreate {
  user_id: string;
  reflection_type: string;
  content: string;
  date: string;
}

export async function createReflection(data: ReflectionCreate): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/reflections/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
}

export interface ReflectionUpdate {
  reflection_type?: string;
  content?: string;
  date?: string;
}

export async function updateReflection(id: string, data: ReflectionUpdate): Promise<ReflectionResponse> {
  const res = await fetch(`${API_BASE_URL}/reflections/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<ReflectionResponse>;
}

export async function deleteReflection(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/reflections/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
}

export async function fetchReflections(userId: string): Promise<ReflectionResponse[]> {
  const res = await fetch(`${API_BASE_URL}/reflections/?user_id=${userId}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<ReflectionResponse[]>;
}
