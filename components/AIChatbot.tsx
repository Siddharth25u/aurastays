
"use client";

import { useState } from "react";
import {
  Bot,
  X,
  Send,
  Sparkles,
  Hotel,
  CalendarDays,
  Wallet,
  MessageCircle,
  ChevronRight,
} from "lucide-react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ApiResponse = {
  message?: string;
  error?: string;
};

const quickActions = [
  {
    label: "Find a hotel",
    icon: Hotel,
    message: "Help me find a hotel.",
  },
  {
    label: "Booking help",
    icon: CalendarDays,
    message: "Explain how I can book a room.",
  },
  {
    label: "Price information",
    icon: Wallet,
    message: "How do hotel prices work?",
  },
];

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! 👋 I'm Aura, your AuraStays AI assistant. You can talk to me normally about hotels, bookings, travel, or anything related to your stay.",
    },
  ]);

  const sendMessage = async (customMessage?: string) => {
    const text = (customMessage ?? input).trim();

    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: text,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
        }),
      });

      const responseText = await response.text();

      let data: ApiResponse = {};

      try {
        data = responseText
          ? (JSON.parse(responseText) as ApiResponse)
          : {};
      } catch {
        throw new Error(
          `Server returned an invalid response. Status: ${response.status}`,
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Request failed with status ${response.status}.`,
        );
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content:
          data.message ||
          "Sorry, I could not generate a response.",
      };

      setMessages((previousMessages) => [
        ...previousMessages,
        assistantMessage,
      ]);
    } catch (error) {
      console.error("AuraStays chatbot error:", error);

      const errorText =
        error instanceof Error
          ? error.message
          : "Unknown error occurred.";

      const errorMessage: ChatMessage = {
        role: "assistant",
        content: `⚠️ ${errorText}`,
      };

      setMessages((previousMessages) => [
        ...previousMessages,
        errorMessage,
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open AuraStays chatbot"
          className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-black text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:bg-gray-800"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[650px] w-[390px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-black px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                <Bot size={22} />
              </div>

              <div>
                <h2 className="font-semibold">
                  AuraStays Assistant
                </h2>

                <div className="flex items-center gap-1 text-xs text-gray-300">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  AI Assistant
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
              className="rounded-full p-2 transition hover:bg-white/15"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles size={17} className="text-purple-600" />

                <span className="text-sm font-semibold text-gray-800">
                  Talk to Aura
                </span>
              </div>

              <p className="text-xs leading-5 text-gray-500">
                Ask anything about your stay or have a normal conversation.
              </p>
            </div>

            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "rounded-br-sm bg-black text-white"
                      : "rounded-bl-sm border border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
                  <span className="animate-pulse">
                    Aura is thinking...
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 bg-white p-3">
            <div className="mb-3 space-y-2">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => sendMessage(action.message)}
                    disabled={isLoading}
                    className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-3 py-2 text-left text-xs text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2">
                      <Icon size={15} />
                      {action.label}
                    </span>

                    <ChevronRight size={14} />
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Talk to Aura..."
                disabled={isLoading}
                className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed"
              />

              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send size={17} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}