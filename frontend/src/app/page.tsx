"use client";

import { useEffect, useState } from "react";
import { PromptType } from "@/lib/api";
import { loadSessions, SessionEntry } from "@/lib/sessions";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activePromptType, setActivePromptType] = useState<PromptType>(null);
  const [sessions, setSessions] = useState<SessionEntry[]>([]);

  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  function handleNewSession(promptType: PromptType) {
    setActiveSessionId(null);
    setActivePromptType(promptType);
    setIsSidebarOpen(false);
  }

  function handleSelectSession(session: SessionEntry) {
    setActiveSessionId(session.id);
    setActivePromptType(session.promptType);
    setIsSidebarOpen(false);
  }

  function handleSessionCreated(sessionId: string, updatedSessions: SessionEntry[]) {
    setActiveSessionId(sessionId);
    setSessions(updatedSessions);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed on mobile, static on desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-200 md:relative md:z-auto md:translate-x-0 md:w-64 md:flex-shrink-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          activeSessionId={activeSessionId}
          sessions={sessions}
          onNewSession={handleNewSession}
          onSelectSession={handleSelectSession}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 md:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
          <span className="font-semibold text-gray-900">Mirror</span>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow
            sessionId={activeSessionId}
            promptType={activePromptType}
            onSessionCreated={handleSessionCreated}
          />
        </div>
      </div>
    </div>
  );
}
