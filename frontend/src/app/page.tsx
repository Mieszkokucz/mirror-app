"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SessionResponse, SystemPromptResponse, ReflectionResponse, FileResponse, ProjectResponse, PeriodicReflectionResponse, fetchSessions, fetchSessionDetail, fetchSystemPrompts, fetchReflections, fetchLibraryFiles, fetchProjects, fetchPeriodicReflections, createProject, deleteProject, fetchAutoContext, fetchAutoContextPeriodic } from "@/lib/api";
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
  const [periodicReflections, setPeriodicReflections] = useState<PeriodicReflectionResponse[]>([]);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const isFirstRender = useRef(true);

  // Chat attachment state (lifted from ChatWindow for sidebar access)
  const [chatPromptValue, setChatPromptValue] = useState(FREE_CHAT_ID);
  const [attachedReflectionIds, setAttachedReflectionIds] = useState<string[]>([]);
  const [attachedFileIds, setAttachedFileIds] = useState<string[]>([]);
  const [attachedPeriodicReflections, setAttachedPeriodicReflections] = useState<PeriodicReflectionResponse[]>([]);
  const [periodicDateRange, setPeriodicDateRange] = useState<{ dateFrom: string; dateTo: string } | null>(null);

  // Prompt panel state
  const [promptPanelOpen, setPromptPanelOpen] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [promptPanelMode, setPromptPanelMode] = useState<PromptPanelMode>("view");

  function reloadSessions() {
    fetchSessions(USER_ID, activeProjectId ?? undefined).then(setSessions).catch(() => {});
  }

  function reloadPrompts() {
    fetchSystemPrompts(USER_ID, activeProjectId ?? undefined).then(setPrompts).catch(() => {});
  }

  function reloadReflections() {
    fetchReflections(USER_ID).then(setReflections).catch(() => {});
  }

  function reloadLibrary() {
    fetchLibraryFiles(USER_ID, activeProjectId ?? undefined).then(setLibraryFiles).catch(() => {});
  }

  function reloadPeriodicReflections() {
    fetchPeriodicReflections(USER_ID).then(setPeriodicReflections).catch(() => {});
  }

  function reloadProjects() {
    fetchProjects(USER_ID).then(setProjects).catch(() => {});
  }

  useEffect(() => {
    reloadSessions();
    reloadPrompts();
    reloadReflections();
    reloadLibrary();
    reloadProjects();
    reloadPeriodicReflections();
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    reloadSessions();
    reloadPrompts();
    reloadLibrary();
    setActiveSessionId(null);
    setChatPromptValue(FREE_CHAT_ID);
  }, [activeProjectId]);

  // Auto-attach today's reflections when evening/midday prompt is selected
  const AUTO_ATTACH_PROMPTS = ["evening_reflection", "midday_reflection"];
  useEffect(() => {
    if (activeSessionId !== null) return; // auto-attach only for a fresh chat
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

  const PERIODIC_DAYS_BACK: Partial<Record<string, number>> = {
    periodic_weekly: 6,
    periodic_monthly: 29,
  };

  useEffect(() => {
    if (activeSessionId !== null) return; // range panel only for a fresh chat
    if (chatPromptValue === FREE_CHAT_ID) { setPeriodicDateRange(null); return; }
    const prompt = prompts.find((p) => p.id === chatPromptValue);
    if (!prompt) { setPeriodicDateRange(null); return; }
    const daysBack = prompt.type ? PERIODIC_DAYS_BACK[prompt.type] : undefined;
    if (daysBack !== undefined) {
      const today = new Date();
      const from = new Date(today);
      from.setDate(from.getDate() - daysBack);
      setPeriodicDateRange({ dateFrom: from.toISOString().slice(0, 10), dateTo: today.toISOString().slice(0, 10) });
      setAttachedReflectionIds([]);
    } else {
      setPeriodicDateRange(null);
    }
  }, [chatPromptValue]);

  function handleStartChat(promptId: string = FREE_CHAT_ID) {
    setActiveSessionId(null);
    setChatPromptValue(promptId);
    setAttachedReflectionIds([]);
    setAttachedFileIds([]);
    setAttachedPeriodicReflections([]);
    setPeriodicDateRange(null);
    setActiveView("chat");
    setIsSidebarOpen(false);
  }

  async function handleApplyPeriodicRange() {
    if (!periodicDateRange || chatPromptValue === FREE_CHAT_ID) return;
    const prompt = prompts.find((p) => p.id === chatPromptValue);
    const range = periodicDateRange;
    setPeriodicDateRange(null);

    const reflectionType =
      prompt?.type === "periodic_weekly" ? "weekly"
      : prompt?.type === "periodic_monthly" ? "monthly"
      : null;

    try {
      const [dailyResults, periodicResult] = await Promise.all([
        fetchAutoContext(chatPromptValue, USER_ID, range.dateFrom, range.dateTo),
        reflectionType
          ? fetchAutoContextPeriodic(USER_ID, range.dateFrom, range.dateTo, reflectionType)
          : Promise.resolve(null),
      ]);

      const dailyIds = dailyResults.map((r) => r.id);
      setAttachedReflectionIds((prev) => [...new Set([...prev, ...dailyIds])]);

      if (periodicResult) {
        setAttachedPeriodicReflections((prev) =>
          prev.find((r) => r.id === periodicResult.id) ? prev : [...prev, periodicResult]
        );
      }
    } catch (err) {
      console.error("Failed to apply periodic range:", err);
    }
  }

  async function handleSelectSession(sessionId: string) {
    setActiveSessionId(sessionId);
    setActiveView("chat");
    setPeriodicDateRange(null);
    try {
      const detail = await fetchSessionDetail(sessionId);
      setChatPromptValue(detail.prompt_id ?? FREE_CHAT_ID);

      // Restore attached contexts from the session's last user message
      const reflectionIds = detail.attached_contexts
        .filter((c) => c.type === "reflection")
        .map((c) => c.id);
      const fileIds = detail.attached_contexts
        .filter((c) => c.type === "file")
        .map((c) => c.id);
      const periodicIds = new Set(
        detail.attached_contexts
          .filter((c) => c.type === "periodic_reflection")
          .map((c) => c.id)
      );
      setAttachedReflectionIds(reflectionIds);
      setAttachedFileIds(fileIds);
      setAttachedPeriodicReflections(
        periodicReflections.filter((r) => periodicIds.has(r.id))
      );
    } catch {
      /* zostaw bieżący prompt jeśli fetch padnie; wyczyść attachmenty dla spójności */
      handleClearAttachments();
    }
  }

  function handleSessionCreated(sessionId: string) {
    setActiveSessionId(sessionId);
    reloadSessions();
  }

  async function handleProjectCreate(name: string, description?: string) {
    await createProject(USER_ID, name, description);
    reloadProjects();
  }

  async function handleProjectDelete(id: string) {
    await deleteProject(id, USER_ID);
    if (activeProjectId === id) setActiveProjectId(null);
    reloadProjects();
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
    setAttachedPeriodicReflections([]);
  }

  function handleRemovePeriodicReflection(id: string) {
    setAttachedPeriodicReflections((prev) => prev.filter((r) => r.id !== id));
  }

  function handleTogglePeriodicReflection(id: string) {
    const reflection = periodicReflections.find((r) => r.id === id);
    if (!reflection) return;
    setAttachedPeriodicReflections((prev) =>
      prev.find((r) => r.id === id) ? prev.filter((r) => r.id !== id) : [...prev, reflection]
    );
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
  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId]
  );

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
          onNewSession={handleStartChat}
          onSelectSession={handleSelectSession}
          onClose={() => setIsSidebarOpen(false)}
          reflections={reflections}
          onAttachByDate={handleAttachByDate}
          onSetPromptForChat={handleStartChat}
          projects={projects}
          activeProjectId={activeProjectId}
          onProjectSelect={setActiveProjectId}
          onProjectCreate={handleProjectCreate}
          onProjectDelete={handleProjectDelete}
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
            activeProjectId={activeProjectId}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-gray-800 bg-gray-950 px-4 py-4 pl-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-600">Mirror</span>
            <span className="text-gray-700">/</span>
            {activeProjectId ? (
              <button
                onClick={() => setActiveProjectId(null)}
                className="text-gray-300 hover:text-gray-100 transition"
              >
                {activeProject?.name ?? "Project"}
              </button>
            ) : (
              <span className="text-gray-500">Main</span>
            )}
          </div>
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
              promptLocked={activeSessionId !== null}
              onSessionCreated={handleSessionCreated}
              prompts={prompts}
              reflections={reflections}
              promptValue={chatPromptValue}
              onPromptChange={setChatPromptValue}
              attachedReflectionIds={attachedReflectionIds}
              attachedPeriodicReflections={attachedPeriodicReflections}
              onRemovePeriodicReflection={handleRemovePeriodicReflection}
              periodicReflections={periodicReflections}
              onTogglePeriodicReflection={handleTogglePeriodicReflection}
              onAttachByDate={handleAttachByDate}
              onRemoveAttachmentsByDate={handleRemoveAttachmentsByDate}
              onClearAttachments={handleClearAttachments}
              libraryFiles={libraryFiles}
              attachedFileIds={attachedFileIds}
              onToggleFileId={handleToggleFileId}
              activeProjectId={activeProjectId}
              periodicDateRange={periodicDateRange}
              onPeriodicDateRangeChange={setPeriodicDateRange}
              onApplyPeriodicRange={handleApplyPeriodicRange}
            />
          ) : activeView === "reflections" ? (
            <ReflectionsView />
          ) : (
            <LibraryView files={libraryFiles} onFilesChange={reloadLibrary} activeProjectId={activeProjectId} />
          )}
        </div>
      </div>
    </div>
  );
}
