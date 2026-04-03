"use client";

import { useEffect, useRef, useState } from "react";
import { sendChatMessage, fetchSessionMessages, SystemPromptResponse, ReflectionResponse } from "@/lib/api";
import { MODELS, DEFAULT_MODEL, FREE_CHAT_ID, FREE_CHAT_META, USER_ID } from "@/lib/constants";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface PromptOption {
  value: string;
  label: string;
}

interface ChatWindowProps {
  sessionId: string | null;
  onSessionCreated: (sessionId: string) => void;
  prompts: SystemPromptResponse[];
  reflections: ReflectionResponse[];
  promptValue: string;
  onPromptChange: (value: string) => void;
  attachedReflectionIds: string[];
  onAttachByDate: (date: string) => void;
  onRemoveAttachmentsByDate: (date: string) => void;
  onClearAttachments: () => void;
}

export default function ChatWindow({
  sessionId,
  onSessionCreated,
  prompts: dbPrompts,
  reflections,
  promptValue,
  onPromptChange,
  attachedReflectionIds,
  onAttachByDate,
  onRemoveAttachmentsByDate,
  onClearAttachments,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const prompts: readonly PromptOption[] = [
    { value: FREE_CHAT_ID, label: FREE_CHAT_META.label },
    ...dbPrompts.map((p) => ({ value: p.id, label: p.display_name })),
  ];
  const attachedReflections = reflections.filter((r) =>
    attachedReflectionIds.includes(r.id)
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);
  const justCreatedSessionRef = useRef(false);

  // Load messages when session changes
  useEffect(() => {
    if (justCreatedSessionRef.current) {
      justCreatedSessionRef.current = false;
      return;
    }
    setError(null);
    if (sessionId) {
      setIsLoading(true);
      fetchSessionMessages(sessionId)
        .then((msgs) =>
          setMessages(
            msgs.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            }))
          )
        )
        .catch((err) => setError(err.message))
        .finally(() => setIsLoading(false));
    } else {
      setMessages([]);
    }
  }, [sessionId]);

  function handleScroll() {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    shouldAutoScroll.current = atBottom;
  }

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
        prompt_id: promptValue === FREE_CHAT_ID ? undefined : promptValue,
        model,
        user_id: USER_ID,
        context_reflection_ids: attachedReflectionIds.length > 0 ? attachedReflectionIds : undefined,
      });
      onClearAttachments();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.response },
      ]);

      if (!sessionId) {
        justCreatedSessionRef.current = true;
        onSessionCreated(res.session_id);
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
  const currentPrompt = prompts.find((p) => p.value === promptValue);
  const isFreeChatSelected = promptValue === FREE_CHAT_ID;
  const displayMeta = isFreeChatSelected
    ? FREE_CHAT_META
    : { label: currentPrompt?.label ?? "Prompt", emoji: "📝", description: "Guided reflection session." };

  return (
    <div className="flex h-full flex-col bg-gray-950">
      {/* Message area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        <div className="mx-auto max-w-3xl">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 text-4xl">{displayMeta.emoji}</div>
              <h2 className="mb-2 text-xl font-semibold text-gray-200">
                {displayMeta.label}
              </h2>
              <p className="max-w-sm text-sm text-gray-500">
                {displayMeta.description}
              </p>
              <p className="mt-6 text-xs text-gray-600">
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
                <div className="mt-2 rounded-lg bg-red-900/30 px-4 py-3 text-sm text-red-400">
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
        <ChatInput
          onSend={handleSend}
          disabled={isLoading}
          models={MODELS}
          selectedModel={model}
          onModelChange={setModel}
          prompts={prompts}
          selectedPrompt={promptValue}
          onPromptChange={onPromptChange}

          attachedReflections={attachedReflections}
          onRemoveAttachmentsByDate={onRemoveAttachmentsByDate}
          allReflections={reflections}
          onAttachByDate={onAttachByDate}
        />
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="mb-3 flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-gray-800 bg-gray-900 px-4 py-3">
        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:300ms]" />
      </div>
    </div>
  );
}
