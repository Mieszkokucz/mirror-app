"use client";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export default function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-3`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? "bg-gray-800 text-gray-100 rounded-br-sm"
            : "bg-gray-900 text-gray-300 border border-gray-800 rounded-bl-sm"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
