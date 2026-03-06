"use client";

import { useEffect, useState } from "react";
import { fetchReflections, createReflection, ReflectionResponse } from "@/lib/api";
import { USER_ID } from "@/lib/constants";
import Calendar from "./Calendar";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function typeLabel(reflectionType: string): string {
  switch (reflectionType) {
    case "morning": return "Morning";
    case "afternoon": return "Afternoon";
    case "evening": return "Evening";
    default: return reflectionType;
  }
}

function todayStr(): string {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
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

  function loadReflections() {
    fetchReflections(USER_ID)
      .then(setReflections)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadReflections();
  }, []);

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
      await createReflection({
        user_id: USER_ID,
        reflection_type: formType,
        content: formContent.trim(),
        date: formDate,
      });
      resetForm();
      fetchReflections(USER_ID).then(setReflections).catch(() => {});
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save reflection");
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    resetForm();
  }

  const reflectionDates = new Set(reflections.map((r) => r.date));

  const filtered = selectedDate
    ? reflections.filter((r) => r.date === selectedDate)
    : reflections;

  // Group by date, sorted descending
  const grouped = new Map<string, ReflectionResponse[]>();
  for (const r of filtered) {
    const list = grouped.get(r.date) ?? [];
    list.push(r);
    grouped.set(r.date, list);
  }
  const sortedDates = [...grouped.keys()].sort((a, b) => b.localeCompare(a));

  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthCount = reflections.filter((r) => r.date.startsWith(thisMonth)).length;

  return (
    <div className="flex h-full flex-col bg-gray-950">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Left: Calendar + Stats */}
            <div className="flex-shrink-0 space-y-4 lg:w-72">
              <Calendar
                reflectionDates={reflectionDates}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />

              {/* Stats */}
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
            </div>

            {/* Right: Entries */}
            <div className="min-w-0 flex-1">
              <button
                onClick={() => setShowForm(true)}
                className="mb-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition"
              >
                + New Reflection
              </button>

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
                        <option value="afternoon">Afternoon</option>
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
                      onClick={handleCancel}
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
                            <span className="mb-1 inline-block rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                              {typeLabel(r.reflection_type)}
                            </span>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                              {r.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
