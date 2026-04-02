"use client";

import { useState, useEffect } from "react";
import { SystemPromptResponse, createSystemPrompt, updateSystemPrompt, deleteSystemPrompt } from "@/lib/api";
import { USER_ID } from "@/lib/constants";

export type PromptPanelMode = "view" | "edit" | "create";

interface PromptPanelProps {
  prompt: SystemPromptResponse | null;
  mode: PromptPanelMode;
  onModeChange: (mode: PromptPanelMode) => void;
  onClose: () => void;
  onSaved: () => void;
}

export default function PromptPanel({ prompt, mode, onModeChange, onClose, onSaved }: PromptPanelProps) {
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isBuiltIn = prompt?.user_id === null;

  useEffect(() => {
    if (mode === "edit" && prompt) {
      setName(prompt.name);
      setDisplayName(prompt.display_name);
      setContent(prompt.content);
    } else if (mode === "create") {
      setName("");
      setDisplayName("");
      setContent("");
    }
    setError(null);
    setConfirmDelete(false);
  }, [mode, prompt?.id]);

  async function handleSave() {
    if (!name.trim() || !displayName.trim() || !content.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      if (mode === "create") {
        await createSystemPrompt({
          name: name.trim(),
          display_name: displayName.trim(),
          content: content.trim(),
          user_id: USER_ID,
        });
      } else if (mode === "edit" && prompt) {
        await updateSystemPrompt(prompt.id, {
          name: name.trim(),
          display_name: displayName.trim(),
          content: content.trim(),
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save prompt");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!prompt) return;
    setIsSaving(true);
    setError(null);
    try {
      await deleteSystemPrompt(prompt.id);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete prompt");
    } finally {
      setIsSaving(false);
      setConfirmDelete(false);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
    });
  }

  const title = mode === "create" ? "New Prompt" : prompt?.display_name ?? "Prompt";

  return (
    <div className="flex h-full flex-col bg-gray-950">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-800 px-4 py-4">
        <h2 className="truncate text-sm font-semibold text-gray-200">{title}</h2>
        <button
          onClick={onClose}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded text-gray-500 hover:bg-gray-800 hover:text-gray-300"
          aria-label="Close panel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {mode === "view" && prompt ? (
          <div className="space-y-4">
            {/* Meta */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{prompt.name}</span>
              {isBuiltIn && (
                <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-500">Built-in</span>
              )}
            </div>

            {/* Content */}
            <div>
              <h3 className="mb-2 text-xs font-medium text-gray-500">Content</h3>
              <pre className="whitespace-pre-wrap rounded-lg bg-gray-900 p-4 text-sm leading-relaxed text-gray-300">
                {prompt.content}
              </pre>
            </div>

            {/* Dates */}
            <div className="space-y-1 text-xs text-gray-600">
              <p>Created: {formatDate(prompt.created_at)}</p>
              <p>Updated: {formatDate(prompt.updated_at)}</p>
            </div>

            {/* Actions */}
            {!isBuiltIn && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => onModeChange("edit")}
                  className="rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-gray-200 transition hover:bg-gray-700"
                >
                  Edit
                </button>
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Delete this prompt?</span>
                    <button
                      onClick={handleDelete}
                      disabled={isSaving}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white transition hover:bg-red-500 disabled:opacity-50"
                    >
                      {isSaving ? "Deleting..." : "Confirm"}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-gray-400 transition hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-red-400 transition hover:bg-gray-700"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
        ) : (
          /* Edit / Create form */
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. my-custom-prompt"
                className="w-full rounded-lg bg-gray-900 px-3 py-2 text-sm text-gray-200 outline-none ring-1 ring-gray-800 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. My Custom Prompt"
                className="w-full rounded-lg bg-gray-900 px-3 py-2 text-sm text-gray-200 outline-none ring-1 ring-gray-800 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                placeholder="System prompt content..."
                className="w-full rounded-lg bg-gray-900 px-3 py-2 text-sm leading-relaxed text-gray-200 outline-none ring-1 ring-gray-800 focus:ring-blue-500 resize-none"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving || !name.trim() || !displayName.trim() || !content.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => mode === "edit" ? onModeChange("view") : onClose()}
                className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
