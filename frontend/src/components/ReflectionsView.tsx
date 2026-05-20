"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchReflections, createReflection, updateReflection, deleteReflection, exportReflections,
  fetchPeriodicReflections, createPeriodicReflection, updatePeriodicReflection, deletePeriodicReflection,
  ReflectionResponse, PeriodicReflectionResponse, PeriodicReflectionType,
} from "@/lib/api";
import { USER_ID } from "@/lib/constants";
import Calendar from "./Calendar";
import TimelinePanel, { TimelineGroup } from "./TimelinePanel";
import NewPeriodicDropdown from "./NewPeriodicDropdown";
import { getISOWeekNumber, getWeekBounds, getMonthBounds, formatWeekLabel } from "@/lib/utils";

type ViewMode = "calendar" | "timeline";
type PanelSelection =
  | { kind: "none" }
  | { kind: "periodic"; id: string }
  | { kind: "new-periodic"; reflectionType: PeriodicReflectionType; dateFrom: string; dateTo: string };

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function typeLabel(reflectionType: string): string {
  switch (reflectionType) {
    case "morning": return "Morning";
    case "midday": return "Midday";
    case "evening": return "Evening";
    case "weekly": return "Weekly";
    case "monthly": return "Monthly";
    case "weekly_plan": return "Weekly Plan";
    case "monthly_plan": return "Monthly Plan";
    default: return reflectionType;
  }
}

function todayStr(): string {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function periodicHeaderLabel(r: PeriodicReflectionResponse): string {
  const d = new Date(r.date_from + "T00:00:00");
  if (r.reflection_type === "monthly" || r.reflection_type === "monthly_plan") {
    const prefix = r.reflection_type === "monthly_plan" ? "Monthly Plan" : "Monthly Reflection";
    return `${prefix} · ${d.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
  }
  const prefix = r.reflection_type === "weekly_plan" ? "Weekly Plan" : "Weekly Reflection";
  const { week } = getISOWeekNumber(d);
  return `${prefix} · ${formatWeekLabel(r.date_from, r.date_to, week)}`;
}

export default function ReflectionsView() {
  const [reflections, setReflections] = useState<ReflectionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState(todayStr());
  const [formType, setFormType] = useState("morning");
  const [formContent, setFormContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editType, setEditType] = useState("morning");
  const [editDate, setEditDate] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("mirror.reflections.view") as ViewMode) ?? "calendar";
    }
    return "calendar";
  });

  const [periodicReflections, setPeriodicReflections] = useState<PeriodicReflectionResponse[]>([]);
  const [periodicLoading, setPeriodicLoading] = useState(true);
  const [panelSelection, setPanelSelection] = useState<PanelSelection>({ kind: "none" });
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const [periodicEditContent, setPeriodicEditContent] = useState("");
  const [isPeriodicEditing, setIsPeriodicEditing] = useState(false);
  const [isPeriodicDeleting, setIsPeriodicDeleting] = useState(false);

  useEffect(() => {
    localStorage.setItem("mirror.reflections.view", viewMode);
    setPanelSelection({ kind: "none" });
  }, [viewMode]);

  function loadReflections() {
    fetchReflections(USER_ID)
      .then(setReflections)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }

  function loadPeriodicReflections() {
    fetchPeriodicReflections(USER_ID)
      .then(setPeriodicReflections)
      .catch((err) => setError(err.message))
      .finally(() => setPeriodicLoading(false));
  }

  useEffect(() => {
    loadReflections();
    loadPeriodicReflections();
  }, []);

  const timelineGroups = useMemo<TimelineGroup[]>(() => {
    const map = new Map<string, {
      monthly: PeriodicReflectionResponse | null;
      monthlyPlan: PeriodicReflectionResponse | null;
      weeks: PeriodicReflectionResponse[];
      weeklyPlans: PeriodicReflectionResponse[];
    }>();

    for (const r of periodicReflections) {
      const monthKey = r.date_from.slice(0, 7);
      if (!map.has(monthKey)) map.set(monthKey, { monthly: null, monthlyPlan: null, weeks: [], weeklyPlans: [] });
      const group = map.get(monthKey)!;
      if (r.reflection_type === "monthly") group.monthly = r;
      else if (r.reflection_type === "monthly_plan") group.monthlyPlan = r;
      else if (r.reflection_type === "weekly_plan") group.weeklyPlans.push(r);
      else group.weeks.push(r);
    }

    return [...map.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([monthKey, { monthly, monthlyPlan, weeks, weeklyPlans }]) => {
        const [y, m] = monthKey.split("-").map(Number);
        const monthLabel = new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
        const monthBounds = getMonthBounds(y, m - 1);
        return {
          monthKey,
          monthLabel,
          monthly,
          monthlyPlan,
          monthlyPlaceholder: monthBounds,
          weeks: weeks.sort((a, b) => b.date_from.localeCompare(a.date_from)),
          weeklyPlans: weeklyPlans.sort((a, b) => b.date_from.localeCompare(a.date_from)),
        };
      });
  }, [periodicReflections]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;

      if (e.key === "c") { setViewMode("calendar"); return; }
      if (e.key === "t") { setViewMode("timeline"); return; }

      if (viewMode === "calendar") {
        if (e.key === "n") { setShowForm(true); return; }
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          const cur = selectedDate ?? todayStr();
          const d = new Date(cur + "T00:00:00");
          d.setDate(d.getDate() + (e.key === "ArrowLeft" ? -1 : 1));
          setSelectedDate(d.toISOString().slice(0, 10));
        }
      }

      if (viewMode === "timeline") {
        if (e.key === "n") { setShowNewDropdown(true); return; }
        if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          const allEntries = timelineGroups.flatMap((g) => [
            ...(g.monthly ? [g.monthly] : []),
            ...(g.monthlyPlan ? [g.monthlyPlan] : []),
            ...g.weeks,
            ...g.weeklyPlans,
          ]);
          if (allEntries.length === 0) return;
          const curId = panelSelection.kind === "periodic" ? panelSelection.id : null;
          const idx = curId ? allEntries.findIndex((r) => r.id === curId) : -1;
          const delta = e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 1;
          const next = allEntries[Math.max(0, Math.min(allEntries.length - 1, idx + delta))];
          if (next) setPanelSelection({ kind: "periodic", id: next.id });
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [viewMode, selectedDate, panelSelection]);

  async function handleExport(dateFrom?: string, dateTo?: string) {
    setIsExporting(true);
    try {
      await exportReflections(USER_ID, dateFrom || undefined, dateTo || undefined);
      setShowExportMenu(false);
      setExportFrom("");
      setExportTo("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export reflections");
    } finally {
      setIsExporting(false);
    }
  }

  function resetForm() {
    setShowForm(false);
    setFormContent("");
    setFormDate(todayStr());
    setFormType("morning");
    setSaveError(null);
  }

  async function handleSave() {
    if (!formContent.trim()) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await createReflection({ user_id: USER_ID, reflection_type: formType, content: formContent.trim(), date: formDate });
      resetForm();
      fetchReflections(USER_ID).then(setReflections).catch(() => {});
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save reflection");
    } finally {
      setIsSaving(false);
    }
  }

  function startEdit(r: ReflectionResponse) {
    setEditingId(r.id);
    setEditContent(r.content);
    setEditType(r.reflection_type);
    setEditDate(r.date);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditContent("");
    setEditType("morning");
    setEditDate("");
  }

  async function handleUpdate() {
    if (!editingId || !editContent.trim()) return;
    setIsSaving(true);
    try {
      await updateReflection(editingId, { content: editContent.trim(), reflection_type: editType, date: editDate });
      cancelEdit();
      fetchReflections(USER_ID).then(setReflections).catch(() => {});
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to update reflection");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setIsSaving(true);
    try {
      await deleteReflection(id);
      setIsDeleting(null);
      fetchReflections(USER_ID).then(setReflections).catch(() => {});
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to delete reflection");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePeriodicSave(reflectionType: PeriodicReflectionType, dateFrom: string, dateTo: string, content: string) {
    if (!content.trim()) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const created = await createPeriodicReflection({ user_id: USER_ID, reflection_type: reflectionType, content: content.trim(), date_from: dateFrom, date_to: dateTo });
      await fetchPeriodicReflections(USER_ID).then(setPeriodicReflections).catch(() => {});
      setPanelSelection({ kind: "periodic", id: created.id });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save reflection");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePeriodicUpdate(id: string, content: string) {
    if (!content.trim()) return;
    setIsSaving(true);
    try {
      await updatePeriodicReflection(id, { content: content.trim() });
      setIsPeriodicEditing(false);
      fetchPeriodicReflections(USER_ID).then(setPeriodicReflections).catch(() => {});
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to update reflection");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePeriodicDelete(id: string) {
    setIsSaving(true);
    try {
      await deletePeriodicReflection(id);
      setIsPeriodicDeleting(false);
      setPanelSelection({ kind: "none" });
      fetchPeriodicReflections(USER_ID).then(setPeriodicReflections).catch(() => {});
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to delete reflection");
    } finally {
      setIsSaving(false);
    }
  }

  const reflectionDates = new Set(reflections.map((r) => r.date));
  const filtered = selectedDate ? reflections.filter((r) => r.date === selectedDate) : reflections;
  const grouped = new Map<string, ReflectionResponse[]>();
  for (const r of filtered) {
    const list = grouped.get(r.date) ?? [];
    list.push(r);
    grouped.set(r.date, list);
  }
  const sortedDates = [...grouped.keys()].sort((a, b) => b.localeCompare(a));

  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthCount = reflections.filter((r) => r.date.startsWith(thisMonth)).length;

  const weeklyCount = periodicReflections.filter((r) => r.reflection_type === "weekly").length;
  const monthlyCount = periodicReflections.filter((r) => r.reflection_type === "monthly").length;
  const weeklyPlanCount = periodicReflections.filter((r) => r.reflection_type === "weekly_plan").length;
  const monthlyPlanCount = periodicReflections.filter((r) => r.reflection_type === "monthly_plan").length;

  const activePeriodic = panelSelection.kind === "periodic"
    ? periodicReflections.find((r) => r.id === panelSelection.id) ?? null
    : null;

  return (
    <div className="flex h-full flex-col bg-gray-950">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Left column */}
            <div className="flex-shrink-0 space-y-4 lg:w-72">
              {/* View toggle */}
              <div className="flex rounded-lg border border-gray-800 bg-gray-900 p-0.5">
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    viewMode === "calendar" ? "bg-gray-700 text-gray-100" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  📅 Calendar
                </button>
                <button
                  onClick={() => setViewMode("timeline")}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    viewMode === "timeline" ? "bg-gray-700 text-gray-100" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  ≡ Timeline
                </button>
              </div>

              {viewMode === "calendar" ? (
                <>
                  <Calendar
                    reflectionDates={reflectionDates}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                  />
                  <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">Statistics</h3>
                    <div className="flex gap-4">
                      <div>
                        <div className="text-2xl font-semibold text-gray-100">{thisMonthCount}</div>
                        <div className="text-xs text-gray-500">This month</div>
                      </div>
                      <div>
                        <div className="text-2xl font-semibold text-gray-100">{reflections.length}</div>
                        <div className="text-xs text-gray-500">Total</div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {periodicLoading ? (
                    <div className="py-8 text-center text-sm text-gray-500">Loading...</div>
                  ) : (
                    <TimelinePanel
                      groups={timelineGroups}
                      activePeriodId={panelSelection.kind === "periodic" ? panelSelection.id : null}
                      onSelectEntry={(r) => {
                        setPanelSelection({ kind: "periodic", id: r.id });
                        setIsPeriodicEditing(false);
                        setIsPeriodicDeleting(false);
                      }}
                      onSelectPlaceholder={(type, dateFrom, dateTo) => {
                        setPanelSelection({ kind: "new-periodic", reflectionType: type, dateFrom, dateTo });
                        setIsPeriodicEditing(false);
                        setIsPeriodicDeleting(false);
                      }}
                    />
                  )}
                  <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">Statistics</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-2xl font-semibold text-gray-100">{weeklyCount}</div>
                        <div className="text-xs text-gray-500">Weekly</div>
                      </div>
                      <div>
                        <div className="text-2xl font-semibold text-purple-300">{weeklyPlanCount}</div>
                        <div className="text-xs text-gray-500">Weekly Plan</div>
                      </div>
                      <div>
                        <div className="text-2xl font-semibold text-gray-100">{monthlyCount}</div>
                        <div className="text-xs text-gray-500">Monthly</div>
                      </div>
                      <div>
                        <div className="text-2xl font-semibold text-purple-300">{monthlyPlanCount}</div>
                        <div className="text-xs text-gray-500">Monthly Plan</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right column */}
            <div className="min-w-0 flex-1">
              <div className="relative mb-4 flex gap-2">
                {viewMode === "calendar" ? (
                  <button
                    onClick={() => setShowForm(true)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition"
                  >
                    + New Reflection
                  </button>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setShowNewDropdown(true)}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition"
                    >
                      + New Reflection
                    </button>
                    {showNewDropdown && (
                      <NewPeriodicDropdown
                        periodicReflections={periodicReflections}
                        onSelect={(type, dateFrom, dateTo, existingId) => {
                          setShowNewDropdown(false);
                          setIsPeriodicEditing(false);
                          setIsPeriodicDeleting(false);
                          if (existingId) {
                            setPanelSelection({ kind: "periodic", id: existingId });
                          } else {
                            setPanelSelection({ kind: "new-periodic", reflectionType: type, dateFrom, dateTo });
                          }
                        }}
                        onClose={() => setShowNewDropdown(false)}
                      />
                    )}
                  </div>
                )}

                {viewMode === "calendar" && (
                  <>
                    <button
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 transition"
                    >
                      Export
                    </button>

                    {showExportMenu && (
                      <div className="absolute top-full left-0 z-50 mt-2 rounded-xl border border-gray-800 bg-gray-900 p-4 space-y-3 w-80">
                        <button
                          onClick={() => handleExport()}
                          disabled={isExporting}
                          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition disabled:opacity-50"
                        >
                          {isExporting ? "Exporting..." : "Export All"}
                        </button>
                        <div className="border-t border-gray-800 pt-3">
                          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">Date Range</p>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="mb-1 block text-xs text-gray-500">From</label>
                              <input
                                type="date"
                                value={exportFrom}
                                onChange={(e) => setExportFrom(e.target.value)}
                                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="mb-1 block text-xs text-gray-500">To</label>
                              <input
                                type="date"
                                value={exportTo}
                                onChange={(e) => setExportTo(e.target.value)}
                                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => handleExport(exportFrom, exportTo)}
                            disabled={isExporting || (!exportFrom && !exportTo)}
                            className="mt-2 w-full rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-400 hover:bg-blue-600/10 transition disabled:opacity-50"
                          >
                            {isExporting ? "Exporting..." : "Export Range"}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Calendar view: daily reflections */}
              {viewMode === "calendar" && (
                <>
                  {showForm && (
                    <div className="mb-4 rounded-xl border border-gray-800 bg-gray-900 p-4 space-y-3">
                      <div className="flex gap-3">
                        <div>
                          <label className="mb-1 block text-xs text-gray-500">Date</label>
                          <input
                            type="date"
                            value={formDate}
                            onChange={(e) => setFormDate(e.target.value)}
                            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-gray-500">Type</label>
                          <select
                            value={formType}
                            onChange={(e) => setFormType(e.target.value)}
                            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200"
                          >
                            <option value="morning">Morning</option>
                            <option value="midday">Midday</option>
                            <option value="evening">Evening</option>
                          </select>
                        </div>
                      </div>
                      <textarea
                        value={formContent}
                        onChange={(e) => setFormContent(e.target.value)}
                        placeholder="Write your reflection..."
                        rows={4}
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                      {saveError && (
                        <div className="rounded-lg bg-red-900/30 px-3 py-2 text-sm text-red-400">{saveError}</div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          disabled={isSaving || !formContent.trim()}
                          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500 transition disabled:opacity-50"
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={resetForm}
                          className="rounded-lg px-4 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {isLoading ? (
                    <div className="py-20 text-center text-sm text-gray-500">Loading reflections...</div>
                  ) : error ? (
                    <div className="rounded-lg bg-red-900/30 px-4 py-3 text-sm text-red-400">{error}</div>
                  ) : sortedDates.length === 0 ? (
                    <div className="py-20 text-center">
                      <p className="text-sm text-gray-500">
                        {selectedDate ? "No reflections on this date." : "No reflections yet."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sortedDates.map((date) => (
                        <div key={date} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                          <h3 className="mb-3 text-sm font-medium text-gray-300">{formatDate(date)}</h3>
                          <div className="space-y-3">
                            {grouped.get(date)!.map((r) => (
                              <div key={r.id}>
                                {editingId === r.id ? (
                                  <div className="space-y-3">
                                    <div className="flex gap-3">
                                      <div>
                                        <label className="mb-1 block text-xs text-gray-500">Date</label>
                                        <input
                                          type="date"
                                          value={editDate}
                                          onChange={(e) => setEditDate(e.target.value)}
                                          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200"
                                        />
                                      </div>
                                      <div>
                                        <label className="mb-1 block text-xs text-gray-500">Type</label>
                                        <select
                                          value={editType}
                                          onChange={(e) => setEditType(e.target.value)}
                                          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200"
                                        >
                                          <option value="morning">Morning</option>
                                          <option value="midday">Midday</option>
                                          <option value="evening">Evening</option>
                                        </select>
                                      </div>
                                    </div>
                                    <textarea
                                      value={editContent}
                                      onChange={(e) => setEditContent(e.target.value)}
                                      ref={(el) => {
                                        if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }
                                      }}
                                      className="w-full resize-none overflow-hidden rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={handleUpdate}
                                        disabled={isSaving || !editContent.trim()}
                                        className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500 transition disabled:opacity-50"
                                      >
                                        {isSaving ? "Saving..." : "Save"}
                                      </button>
                                      <button
                                        onClick={cancelEdit}
                                        className="rounded-lg px-4 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : isDeleting === r.id ? (
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-300">Delete this reflection?</span>
                                    <button
                                      onClick={() => handleDelete(r.id)}
                                      disabled={isSaving}
                                      className="rounded-lg bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-500 transition disabled:opacity-50"
                                    >
                                      {isSaving ? "Deleting..." : "Delete"}
                                    </button>
                                    <button
                                      onClick={() => setIsDeleting(null)}
                                      className="rounded-lg px-3 py-1 text-sm text-gray-400 hover:text-gray-200 transition"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <span className="inline-block rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                                        {typeLabel(r.reflection_type)}
                                      </span>
                                      <button
                                        onClick={() => startEdit(r)}
                                        className="rounded p-1 text-gray-600 hover:text-gray-300 transition"
                                        title="Edit"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                                          <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L3.05 10.476a.75.75 0 0 0-.19.336l-.893 3.214a.75.75 0 0 0 .926.926l3.214-.893a.75.75 0 0 0 .336-.19l7.963-7.963a1.75 1.75 0 0 0 0-2.475l-.918-.918ZM11.72 3.22a.25.25 0 0 1 .354 0l.918.918a.25.25 0 0 1 0 .354L12 5.484 10.516 4l.992-.992.212-.212v.424-.424ZM9.81 4.706l1.484 1.484-5.965 5.965-2.035.565.565-2.035 5.951-5.98Z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => setIsDeleting(r.id)}
                                        className="rounded p-1 text-gray-600 hover:text-red-400 transition"
                                        title="Delete"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                                          <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5A.75.75 0 0 1 9.95 6Z" clipRule="evenodd" />
                                        </svg>
                                      </button>
                                    </div>
                                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                                      {r.content}
                                    </p>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Timeline view: periodic reflections panel */}
              {viewMode === "timeline" && (
                <>
                  {saveError && (
                    <div className="mb-4 rounded-lg bg-red-900/30 px-4 py-3 text-sm text-red-400">{saveError}</div>
                  )}
                  {panelSelection.kind === "none" && (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 h-10 w-10 text-gray-700">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                      </svg>
                      <p className="text-sm text-gray-500">Select an entry from the timeline</p>
                    </div>
                  )}

                  {panelSelection.kind === "new-periodic" && (
                    <NewPeriodicForm
                      reflectionType={panelSelection.reflectionType}
                      dateFrom={panelSelection.dateFrom}
                      dateTo={panelSelection.dateTo}
                      isSaving={isSaving}
                      saveError={saveError}
                      onSave={(content) => handlePeriodicSave(panelSelection.reflectionType, panelSelection.dateFrom, panelSelection.dateTo, content)}
                      onCancel={() => setPanelSelection({ kind: "none" })}
                    />
                  )}

                  {panelSelection.kind === "periodic" && (
                    activePeriodic ? (
                      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                        <div className="mb-4 flex items-start justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-gray-200">{periodicHeaderLabel(activePeriodic)}</h3>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {new Date(activePeriodic.date_from + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              {" – "}
                              {new Date(activePeriodic.date_to + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </div>
                          {!isPeriodicEditing && !isPeriodicDeleting && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => { setIsPeriodicEditing(true); setPeriodicEditContent(activePeriodic.content); }}
                                className="rounded p-1 text-gray-600 hover:text-gray-300 transition"
                                title="Edit"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                                  <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L3.05 10.476a.75.75 0 0 0-.19.336l-.893 3.214a.75.75 0 0 0 .926.926l3.214-.893a.75.75 0 0 0 .336-.19l7.963-7.963a1.75 1.75 0 0 0 0-2.475l-.918-.918ZM11.72 3.22a.25.25 0 0 1 .354 0l.918.918a.25.25 0 0 1 0 .354L12 5.484 10.516 4l.992-.992.212-.212v.424-.424ZM9.81 4.706l1.484 1.484-5.965 5.965-2.035.565.565-2.035 5.951-5.98Z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setIsPeriodicDeleting(true)}
                                className="rounded p-1 text-gray-600 hover:text-red-400 transition"
                                title="Delete"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                                  <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5A.75.75 0 0 1 9.95 6Z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>

                        {isPeriodicDeleting ? (
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-300">Delete this reflection?</span>
                            <button
                              onClick={() => handlePeriodicDelete(activePeriodic.id)}
                              disabled={isSaving}
                              className="rounded-lg bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-500 transition disabled:opacity-50"
                            >
                              {isSaving ? "Deleting..." : "Delete"}
                            </button>
                            <button
                              onClick={() => setIsPeriodicDeleting(false)}
                              className="rounded-lg px-3 py-1 text-sm text-gray-400 hover:text-gray-200 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : isPeriodicEditing ? (
                          <div className="space-y-3">
                            <textarea
                              value={periodicEditContent}
                              onChange={(e) => setPeriodicEditContent(e.target.value)}
                              ref={(el) => {
                                if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }
                              }}
                              className="w-full resize-none overflow-hidden rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handlePeriodicUpdate(activePeriodic.id, periodicEditContent)}
                                disabled={isSaving || !periodicEditContent.trim()}
                                className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500 transition disabled:opacity-50"
                              >
                                {isSaving ? "Saving..." : "Save"}
                              </button>
                              <button
                                onClick={() => setIsPeriodicEditing(false)}
                                className="rounded-lg px-4 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">{activePeriodic.content}</p>
                        )}
                      </div>
                    ) : (
                      <div className="py-20 text-center text-sm text-gray-500">Reflection not found.</div>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface NewPeriodicFormProps {
  reflectionType: PeriodicReflectionType;
  dateFrom: string;
  dateTo: string;
  isSaving: boolean;
  saveError: string | null;
  onSave: (content: string) => void;
  onCancel: () => void;
}

function NewPeriodicForm({ reflectionType, dateFrom, dateTo, isSaving, saveError, onSave, onCancel }: NewPeriodicFormProps) {
  const [content, setContent] = useState("");

  const d = new Date(dateFrom + "T00:00:00");
  const { week } = getISOWeekNumber(d);
  const monthRange = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const weekRange = formatWeekLabel(dateFrom, dateTo, week);
  const prefix = (() => {
    switch (reflectionType) {
      case "monthly": return "New Monthly Reflection";
      case "monthly_plan": return "New Monthly Plan";
      case "weekly_plan": return "New Weekly Plan";
      default: return "New Weekly Reflection";
    }
  })();
  const range = reflectionType === "monthly" || reflectionType === "monthly_plan" ? monthRange : weekRange;
  const headerLabel = `${prefix} · ${range}`;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 space-y-3">
      <h3 className="text-sm font-medium text-gray-200">{headerLabel}</h3>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your reflection..."
        rows={6}
        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-blue-500 focus:outline-none"
      />
      {saveError && (
        <div className="rounded-lg bg-red-900/30 px-3 py-2 text-sm text-red-400">{saveError}</div>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => onSave(content)}
          disabled={isSaving || !content.trim()}
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500 transition disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg px-4 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
