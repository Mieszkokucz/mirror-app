"use client";

import { useEffect, useRef, useState } from "react";
import { sendChatMessage, PromptType } from "@/lib/api";
import { saveSession, buildLabel, SessionEntry } from "@/lib/sessions";
import { PROMPT_META } from "@/lib/constants";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatWindowProps {
  sessionId: string | null;
  promptType: PromptType;
  onSessionCreated: (sessionId: string, sessions: SessionEntry[]) => void;
}

export default function ChatWindow({
  sessionId,
  promptType,
  onSessionCreated,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);
  const justCreatedSessionRef = useRef(false);

  // Reset messages when session changes (skip if we just created this session)
  useEffect(() => {
    if (justCreatedSessionRef.current) {
      justCreatedSessionRef.current = false;
      return;
    }
    setMessages([]);
    setError(null);
  }, [sessionId, promptType]);

  // Track whether user has scrolled up
  function handleScroll() {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    shouldAutoScroll.current = atBottom;
  }

  // Auto-scroll only when already at bottom
  useEffect(() => {
    if (shouldAutoScroll.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  async function handleSend(message: string) {
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setIsLoading(true);
    shouldAutoScroll.current = true;

    try {
      const res = await sendChatMessage({
        message,
        session_id: sessionId ?? null,
        prompt: sessionId ? undefined : promptType,
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.response },
      ]);

      if (!sessionId) {
        const now = new Date().toISOString();
        const label = buildLabel(promptType, now);
        const updated = saveSession({
          id: res.session_id,
          label,
          promptType,
          createdAt: now,
        });
        justCreatedSessionRef.current = true;
        onSessionCreated(res.session_id, updated);
      }
    } catch (err) {
      const errMessage =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(errMessage);
    } finally {
      setIsLoading(false);
    }
  }

  const isEmpty = messages.length === 0 && !isLoading;
  const meta = PROMPT_META[promptType ?? "free_chat"];

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Message area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        <div className="mx-auto max-w-3xl">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 text-4xl">{meta.emoji}</div>
              <h2 className="mb-2 text-xl font-semibold text-gray-800">
                {meta.label}
              </h2>
              <p className="max-w-sm text-sm text-gray-500">
                {meta.description}
              </p>
              <p className="mt-6 text-xs text-gray-400">
                Type a message below to get started.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <MessageBubble key={i} role={msg.role} content={msg.content} />
              ))}
              {isLoading && <LoadingDots />}
              {error && (
                <div className="mt-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="mx-auto w-full max-w-3xl">
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="mb-3 flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-gray-100 px-4 py-3">
        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
      </div>
    </div>
  );
}
