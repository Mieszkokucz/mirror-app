"use client";

import { useEffect, useState } from "react";
import { SessionResponse, SystemPromptResponse, ReflectionResponse, FileResponse, fetchSessions, fetchSystemPrompts, fetchReflections, fetchLibraryFiles } from "@/lib/api";
import { USER_ID, FREE_CHAT_ID } from "@/lib/constants";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import ReflectionsView from "@/components/ReflectionsView";
import LibraryView from "@/components/LibraryView";
import PromptPanel, { PromptPanelMode } from "@/components/PromptPanel";

type ActiveView = "chat" | "reflections" | "library";

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>("chat");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [prompts, setPrompts] = useState<SystemPromptResponse[]>([]);
  const [reflections, setReflections] = useState<ReflectionResponse[]>([]);
  const [libraryFiles, setLibraryFiles] = useState<FileResponse[]>([]);

  // Chat attachment state (lifted from ChatWindow for sidebar access)
  const [chatPromptValue, setChatPromptValue] = useState(FREE_CHAT_ID);
  const [attachedReflectionIds, setAttachedReflectionIds] = useState<string[]>([]);
  const [attachedFileIds, setAttachedFileIds] = useState<string[]>([]);

  // Prompt panel state
  const [promptPanelOpen, setPromptPanelOpen] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [promptPanelMode, setPromptPanelMode] = useState<PromptPanelMode>("view");

  function reloadPrompts() {
    fetchSystemPrompts(USER_ID).then(setPrompts).catch(() => {});
  }

  function reloadReflections() {
    fetchReflections(USER_ID).then(setReflections).catch(() => {});
  }

  function reloadLibrary() {
    fetchLibraryFiles(USER_ID).then(setLibraryFiles).catch(() => {});
  }

  useEffect(() => {
    fetchSessions(USER_ID).then(setSessions).catch(() => {});
    reloadPrompts();
    reloadReflections();
    reloadLibrary();
  }, []);

  // Auto-attach today's reflections when evening/midday prompt is selected
  const AUTO_ATTACH_PROMPTS = ["evening_reflection", "midday_reflection"];
  useEffect(() => {
    if (chatPromptValue === FREE_CHAT_ID) return;
    const prompt = prompts.find((p) => p.id === chatPromptValue);
    if (prompt && AUTO_ATTACH_PROMPTS.includes(prompt.name)) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayIds = reflections
        .filter((r) => r.date === todayStr)
        .map((r) => r.id);
      if (todayIds.length > 0) {
        setAttachedReflectionIds((prev) => [...new Set([...prev, ...todayIds])]);
      }
    }
  }, [chatPromptValue]);

  function handleNewSession() {
    setActiveSessionId(null);
    setChatPromptValue(FREE_CHAT_ID);
    setAttachedReflectionIds([]);
    setAttachedFileIds([]);
    setActiveView("chat");
    setIsSidebarOpen(false);
  }

  function handleSelectSession(sessionId: string) {
    setActiveSessionId(sessionId);
    setActiveView("chat");
  }

  function handleSessionCreated(sessionId: string) {
    setActiveSessionId(sessionId);
    fetchSessions(USER_ID).then(setSessions).catch(() => {});
  }

  function handleAttachByDate(date: string) {
    const ids = reflections
      .filter((r) => r.date === date)
      .map((r) => r.id);
    setAttachedReflectionIds((prev) => [...new Set([...prev, ...ids])]);
  }

  function handleRemoveAttachmentsByDate(date: string) {
    const idsToRemove = new Set(
      reflections.filter((r) => r.date === date).map((r) => r.id)
    );
    setAttachedReflectionIds((prev) => prev.filter((id) => !idsToRemove.has(id)));
  }

  function handleClearAttachments() {
    setAttachedReflectionIds([]);
    setAttachedFileIds([]);
  }

  function handleToggleFileId(id: string) {
    setAttachedFileIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSetActiveView(view: ActiveView) {
    setActiveView(view);
    if (view === "chat") {
      reloadReflections();
    }
    if (view === "library") {
      reloadLibrary();
    }
  }

  // Prompt panel handlers
  function handleSelectPrompt(id: string) {
    setSelectedPromptId(id);
    setPromptPanelMode("view");
    setPromptPanelOpen(true);
  }

  function handleEditPrompt(id: string) {
    setSelectedPromptId(id);
    setPromptPanelMode("edit");
    setPromptPanelOpen(true);
  }

  function handleDeletePrompt(id: string) {
    setSelectedPromptId(id);
    setPromptPanelMode("view");
    setPromptPanelOpen(true);
  }

  function handleCreatePrompt() {
    setSelectedPromptId(null);
    setPromptPanelMode("create");
    setPromptPanelOpen(true);
  }

  function handlePromptPanelClose() {
    setPromptPanelOpen(false);
    setSelectedPromptId(null);
  }

  function handlePromptSaved() {
    reloadPrompts();
    handlePromptPanelClose();
  }

  const selectedPrompt = prompts.find((p) => p.id === selectedPromptId) ?? null;

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
        className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-200 md:relative md:z-auto md:flex-shrink-0 md:overflow-hidden md:transition-all ${
          isSidebarOpen ? "translate-x-0 md:w-64" : "-translate-x-full md:translate-x-0 md:w-0"
        }`}
      >
        <Sidebar
          activeSessionId={activeSessionId}
          sessions={sessions}
          prompts={prompts}
          selectedPromptId={selectedPromptId}
          onSelectPrompt={handleSelectPrompt}
          onEditPrompt={handleEditPrompt}
          onDeletePrompt={handleDeletePrompt}
          onCreatePrompt={handleCreatePrompt}
          onNewSession={handleNewSession}
          onSelectSession={handleSelectSession}
          onClose={() => setIsSidebarOpen(false)}
          reflections={reflections}
          onAttachByDate={handleAttachByDate}
          onSetPromptForChat={setChatPromptValue}
        />
      </div>

      {/* Floating hamburger button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
        className={`fixed top-3 z-40 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 transition-all duration-200 ${
          isSidebarOpen ? "left-[16.5rem]" : "left-2"
        }`}
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

      {/* Prompt Panel — between sidebar and main content */}
      {promptPanelOpen && (
        <div className="hidden w-96 flex-shrink-0 border-r border-gray-800 md:block">
          <PromptPanel
            prompt={selectedPrompt}
            mode={promptPanelMode}
            onModeChange={setPromptPanelMode}
            onClose={handlePromptPanelClose}
            onSaved={handlePromptSaved}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-gray-800 bg-gray-950 px-4 py-4 pl-12">
          <div className="ml-auto flex gap-1">
            <button
              onClick={() => handleSetActiveView("chat")}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                activeView === "chat"
                  ? "bg-gray-800 text-gray-100"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => handleSetActiveView("reflections")}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                activeView === "reflections"
                  ? "bg-gray-800 text-gray-100"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Reflections
            </button>
            <button
              onClick={() => handleSetActiveView("library")}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                activeView === "library"
                  ? "bg-gray-800 text-gray-100"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Library
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-hidden">
          {activeView === "chat" ? (
            <ChatWindow
              sessionId={activeSessionId}
              onSessionCreated={handleSessionCreated}
              prompts={prompts}
              reflections={reflections}
              promptValue={chatPromptValue}
              onPromptChange={setChatPromptValue}
              attachedReflectionIds={attachedReflectionIds}
              onAttachByDate={handleAttachByDate}
              onRemoveAttachmentsByDate={handleRemoveAttachmentsByDate}
              onClearAttachments={handleClearAttachments}
              libraryFiles={libraryFiles}
              attachedFileIds={attachedFileIds}
              onToggleFileId={handleToggleFileId}
            />
          ) : activeView === "reflections" ? (
            <ReflectionsView />
          ) : (
            <LibraryView files={libraryFiles} onFilesChange={reloadLibrary} />
          )}
        </div>
      </div>
    </div>
  );
}
