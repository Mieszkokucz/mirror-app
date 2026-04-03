"use client";

import { useState } from "react";
import { SessionResponse, SystemPromptResponse, ReflectionResponse } from "@/lib/api";
import { groupReflectionsByDate } from "@/lib/utils";

interface SidebarProps {
  activeSessionId: string | null;
  sessions: SessionResponse[];
  prompts: SystemPromptResponse[];
  selectedPromptId: string | null;
  onSelectPrompt: (id: string) => void;
  onEditPrompt: (id: string) => void;
  onDeletePrompt: (id: string) => void;
  onCreatePrompt: () => void;
  onNewSession: () => void;
  onSelectSession: (sessionId: string) => void;
  onClose: () => void;
  reflections: ReflectionResponse[];
  onAttachByDate: (date: string) => void;
  onSetPromptForChat: (promptId: string) => void;
}

function groupSessionsByDate(sessions: SessionResponse[]): Map<string, SessionResponse[]> {
  const groups = new Map<string, SessionResponse[]>();
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toDateString();

  for (const session of sessions) {
    const d = new Date(session.updated_at);
    const dStr = d.toDateString();
    let label: string;

    if (dStr === todayStr) {
      label = "Today";
    } else if (dStr === yesterdayStr) {
      label = "Yesterday";
    } else {
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 7) {
        label = d.toLocaleDateString("en-US", { weekday: "long" });
      } else {
        label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
    }

    const list = groups.get(label) ?? [];
    list.push(session);
    groups.set(label, list);
  }

  return groups;
}

function formatTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function Sidebar({
  activeSessionId,
  sessions,
  prompts,
  selectedPromptId,
  onSelectPrompt,
  onEditPrompt,
  onDeletePrompt,
  onCreatePrompt,
  onNewSession,
  onSelectSession,
  onClose,
  reflections,
  onAttachByDate,
  onSetPromptForChat,
}: SidebarProps) {
  const grouped = groupSessionsByDate(sessions);
  const [promptsExpanded, setPromptsExpanded] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const dateGroups = groupReflectionsByDate(reflections);

  const builtInPrompts = prompts.filter((p) => p.user_id === null);
  const customPrompts = prompts.filter((p) => p.user_id !== null);

  return (
    <aside className="flex h-full w-full flex-col border-r border-gray-800 bg-gray-950">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-800 px-4 py-4">
        <h2 className="text-sm font-semibold text-gray-200">Conversations</h2>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded text-gray-500 hover:bg-gray-800 hover:text-gray-300"
          aria-label="Close sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* New session button */}
      <div className="flex-shrink-0 px-3 py-3">
        <button
          onClick={onNewSession}
          className="w-full rounded-lg bg-gray-800 px-3 py-2 text-left text-sm font-medium text-gray-200 transition hover:bg-gray-700"
        >
          + New Chat
        </button>
      </div>

      {/* System Prompts section */}
      <div className="flex-shrink-0 border-b border-gray-800 px-3 pb-3">
        <button
          onClick={() => setPromptsExpanded(!promptsExpanded)}
          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 transition hover:text-gray-300"
        >
          <span>System Prompts ({prompts.length})</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className={`h-3 w-3 transition-transform ${promptsExpanded ? "rotate-90" : ""}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        {promptsExpanded && (
          <div className="mt-1 space-y-0.5">
            {/* Built-in prompts */}
            {builtInPrompts.map((prompt) => (
              <div
                key={prompt.id}
                className={`group flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm transition cursor-pointer ${
                  selectedPromptId === prompt.id
                    ? "bg-gray-800/80 text-gray-100"
                    : "text-gray-400 hover:bg-gray-900 hover:text-gray-200"
                }`}
                onClick={() => onSelectPrompt(prompt.id)}
              >
                <span className="truncate">{prompt.display_name}</span>
                <div className="flex flex-shrink-0 items-center gap-1">
                  <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-500">
                    Built-in
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onSetPromptForChat(prompt.id); }}
                    className="rounded p-1 text-gray-500 opacity-0 transition hover:bg-gray-800 hover:text-gray-300 group-hover:opacity-100"
                    aria-label="Use prompt in chat"
                    title="Use in chat"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3 w-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {/* Custom prompts */}
            {customPrompts.map((prompt) => (
              <div
                key={prompt.id}
                className={`group flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition cursor-pointer ${
                  selectedPromptId === prompt.id
                    ? "bg-gray-800/80 text-gray-100"
                    : "text-gray-300 hover:bg-gray-900 hover:text-gray-200"
                }`}
                onClick={() => onSelectPrompt(prompt.id)}
              >
                <span className="truncate">{prompt.display_name}</span>
                <div
                  className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onSetPromptForChat(prompt.id)}
                    className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                    aria-label="Use prompt in chat"
                    title="Use in chat"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3 w-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onEditPrompt(prompt.id)}
                    className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                    aria-label="Edit prompt"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3 w-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeletePrompt(prompt.id)}
                    className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-red-400"
                    aria-label="Delete prompt"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3 w-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {/* Add prompt button */}
            <button
              onClick={onCreatePrompt}
              className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-blue-400 transition hover:bg-gray-900 hover:text-blue-300"
            >
              + Add Prompt
            </button>
          </div>
        )}
      </div>

      {/* Notes (Reflections) section */}
      <div className="flex-shrink-0 border-b border-gray-800 px-3 pb-3">
        <button
          onClick={() => setNotesExpanded(!notesExpanded)}
          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 transition hover:text-gray-300"
        >
          <span>Notes ({dateGroups.length} days)</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className={`h-3 w-3 transition-transform ${notesExpanded ? "rotate-90" : ""}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        {notesExpanded && (
          <div className="mt-1 space-y-0.5">
            {dateGroups.length === 0 ? (
              <p className="px-2 py-1.5 text-xs text-gray-600">No reflections yet.</p>
            ) : (
              dateGroups.map((group) => (
                <div
                  key={group.date}
                  className="group flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-gray-400 hover:bg-gray-900 hover:text-gray-200"
                >
                  <div className="min-w-0">
                    <span className="truncate">{group.label}</span>
                    <span className="ml-1.5 text-xs text-gray-600">
                      {group.reflections.length} reflection{group.reflections.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <button
                    onClick={() => onAttachByDate(group.date)}
                    className="flex-shrink-0 rounded p-1 text-gray-500 opacity-0 transition hover:bg-gray-800 hover:text-gray-300 group-hover:opacity-100"
                    aria-label={`Attach ${group.label} reflections`}
                    title="Attach to chat"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3 w-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {sessions.length === 0 ? (
          <p className="mt-4 px-1 text-xs text-gray-600">
            No sessions yet. Start a new one above.
          </p>
        ) : (
          <div className="space-y-4 pt-3">
            {[...grouped.entries()].map(([label, groupSessions]) => (
              <div key={label}>
                <h3 className="mb-1 px-2 text-xs font-medium text-gray-600">{label}</h3>
                <ul className="space-y-0.5">
                  {groupSessions.map((session) => (
                    <li key={session.id}>
                      <button
                        onClick={() => onSelectSession(session.id)}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                          activeSessionId === session.id
                            ? "border-l-2 border-blue-400 bg-gray-800/80 text-gray-100"
                            : "text-gray-400 hover:bg-gray-900 hover:text-gray-200"
                        }`}
                      >
                        <span className="text-xs text-gray-500">{formatTime(session.updated_at)}</span>
                        <span className="ml-2">Session</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
