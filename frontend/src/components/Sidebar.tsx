"use client";

import { PromptType, SessionResponse } from "@/lib/api";

interface SidebarProps {
  activeSessionId: string | null;
  sessions: SessionResponse[];
  onNewSession: (promptType: PromptType) => void;
  onSelectSession: (sessionId: string) => void;
  onClose: () => void;
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
  onNewSession,
  onSelectSession,
  onClose,
}: SidebarProps) {
  const grouped = groupSessionsByDate(sessions);

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

      {/* New session buttons */}
      <div className="flex-shrink-0 space-y-2 px-3 py-3">
        <button
          onClick={() => onNewSession("morning_reflection")}
          className="w-full rounded-lg bg-gray-800 px-3 py-2 text-left text-sm font-medium text-gray-200 transition hover:bg-gray-700"
        >
          + Morning Reflection
        </button>
        <button
          onClick={() => onNewSession(null)}
          className="w-full rounded-lg bg-gray-800 px-3 py-2 text-left text-sm font-medium text-gray-200 transition hover:bg-gray-700"
        >
          + Free Chat
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {sessions.length === 0 ? (
          <p className="mt-4 px-1 text-xs text-gray-600">
            No sessions yet. Start a new one above.
          </p>
        ) : (
          <div className="space-y-4">
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
