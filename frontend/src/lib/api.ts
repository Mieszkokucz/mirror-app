import { API_BASE_URL } from "./constants";

export interface ChatRequest {
  message: string;
  session_id?: string | null;
  prompt_id?: string | null;
  model?: string;
  user_id: string;
  context_reflection_ids?: string[];
  context_file_ids?: string[];
  files?: File[];
}

export interface ChatResponse {
  response: string;
  session_id: string;
}

export interface FileResponse {
  id: string;
  user_id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
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
  const form = new FormData();
  form.append("message", req.message);
  form.append("user_id", req.user_id);
  if (req.session_id) form.append("session_id", req.session_id);
  if (req.prompt_id) form.append("prompt_id", req.prompt_id);
  if (req.model) form.append("model", req.model);
  req.context_reflection_ids?.forEach((id) => form.append("context_reflection_ids", id));
  req.context_file_ids?.forEach((id) => form.append("context_file_ids", id));
  req.files?.forEach((f) => form.append("files", f));

  const res = await fetch(`${API_BASE_URL}/chat/`, {
    method: "POST",
    body: form,
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

export interface SystemPromptResponse {
  id: string;
  user_id: string | null;
  name: string;
  display_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface SystemPromptCreate {
  name: string;
  display_name: string;
  content: string;
  user_id: string;
}

export interface SystemPromptUpdate {
  name?: string;
  display_name?: string;
  content?: string;
}

export async function fetchSystemPrompts(userId: string): Promise<SystemPromptResponse[]> {
  const res = await fetch(`${API_BASE_URL}/system-prompts/?user_id=${userId}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<SystemPromptResponse[]>;
}

export async function createSystemPrompt(data: SystemPromptCreate): Promise<SystemPromptResponse> {
  const res = await fetch(`${API_BASE_URL}/system-prompts/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<SystemPromptResponse>;
}

export async function updateSystemPrompt(id: string, data: SystemPromptUpdate): Promise<SystemPromptResponse> {
  const res = await fetch(`${API_BASE_URL}/system-prompts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<SystemPromptResponse>;
}

export async function deleteSystemPrompt(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/system-prompts/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
}

export async function exportReflections(userId: string, dateFrom?: string, dateTo?: string): Promise<void> {
  const params = new URLSearchParams({ user_id: userId });
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);

  const res = await fetch(`${API_BASE_URL}/reflections/export?${params}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  const disposition = res.headers.get("Content-Disposition") || "";
  const filenameMatch = disposition.match(/filename=(.+)/);
  const filename = filenameMatch ? filenameMatch[1] : "reflections_export.txt";

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function fetchReflections(userId: string): Promise<ReflectionResponse[]> {
  const res = await fetch(`${API_BASE_URL}/reflections/?user_id=${userId}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<ReflectionResponse[]>;
}

export async function fetchLibraryFiles(userId: string): Promise<FileResponse[]> {
  const res = await fetch(`${API_BASE_URL}/files/library?user_id=${userId}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<FileResponse[]>;
}

export async function uploadLibraryFile(userId: string, file: File): Promise<FileResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE_URL}/files/library?user_id=${userId}`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<FileResponse>;
}

export async function deleteLibraryFile(fileId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/files/library/${fileId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
}
