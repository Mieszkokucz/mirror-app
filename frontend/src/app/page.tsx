"use client";

import { useEffect, useState } from "react";
import { PromptType, SessionResponse, fetchSessions } from "@/lib/api";
import { USER_ID } from "@/lib/constants";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import ReflectionsView from "@/components/ReflectionsView";

type ActiveView = "chat" | "reflections";

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>("chat");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activePromptType, setActivePromptType] = useState<PromptType>(null);
  const [sessions, setSessions] = useState<SessionResponse[]>([]);

  useEffect(() => {
    fetchSessions(USER_ID).then(setSessions).catch(() => {});
  }, []);

  function handleNewSession(promptType: PromptType) {
    setActiveSessionId(null);
    setActivePromptType(promptType);
    setActiveView("chat");
    setIsSidebarOpen(false);
  }

  function handleSelectSession(sessionId: string) {
    setActiveSessionId(sessionId);
    setActivePromptType(null);
    setActiveView("chat");
    setIsSidebarOpen(false);
  }

  function handleSessionCreated(sessionId: string) {
    setActiveSessionId(sessionId);
    fetchSessions(USER_ID).then(setSessions).catch(() => {});
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-200 md:relative md:z-auto md:flex-shrink-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:-translate-x-full"
        }`}
      >
        <Sidebar
          activeSessionId={activeSessionId}
          sessions={sessions}
          onNewSession={handleNewSession}
          onSelectSession={handleSelectSession}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-gray-800 bg-gray-950 px-4 py-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800"
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
          <span className="text-sm font-semibold text-gray-200">Mirror</span>
          <div className="ml-auto flex gap-1">
            <button
              onClick={() => setActiveView("chat")}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                activeView === "chat"
                  ? "bg-gray-800 text-gray-100"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveView("reflections")}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                activeView === "reflections"
                  ? "bg-gray-800 text-gray-100"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Reflections
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-hidden">
          {activeView === "chat" ? (
            <ChatWindow
              sessionId={activeSessionId}
              promptType={activePromptType}
              onSessionCreated={handleSessionCreated}
            />
          ) : (
            <ReflectionsView />
          )}
        </div>
      </div>
    </div>
  );
}
