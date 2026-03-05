"use client";

import { PromptType } from "@/lib/api";
import { SessionEntry } from "@/lib/sessions";

interface SidebarProps {
  activeSessionId: string | null;
  sessions: SessionEntry[];
  onNewSession: (promptType: PromptType) => void;
  onSelectSession: (session: SessionEntry) => void;
}

export default function Sidebar({
  activeSessionId,
  sessions,
  onNewSession,
  onSelectSession,
}: SidebarProps) {
  return (
    <aside className="flex h-full w-full flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-700 px-4 py-4">
        <h1 className="text-lg font-semibold tracking-tight">Mirror</h1>
        <p className="mt-0.5 text-xs text-gray-400">Personal reflection</p>
      </div>

      {/* New session buttons */}
      <div className="flex-shrink-0 space-y-2 px-3 py-3">
        <button
          onClick={() => onNewSession("morning_reflection")}
          className="w-full rounded-lg bg-blue-600 px-3 py-2 text-left text-sm font-medium transition hover:bg-blue-500"
        >
          + Morning Reflection
        </button>
        <button
          onClick={() => onNewSession(null)}
          className="w-full rounded-lg bg-gray-700 px-3 py-2 text-left text-sm font-medium transition hover:bg-gray-600"
        >
          + Free Chat
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {sessions.length === 0 ? (
          <p className="mt-4 px-1 text-xs text-gray-500">
            No sessions yet. Start a new one above.
          </p>
        ) : (
          <ul className="space-y-1">
            {sessions.map((session) => (
              <li key={session.id}>
                <button
                  onClick={() => onSelectSession(session)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    activeSessionId === session.id
                      ? "bg-gray-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  {session.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
