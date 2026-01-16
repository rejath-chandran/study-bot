"use client"

import { useEffect, useRef, useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

type Message = {
  id: number
  role: "user" | "assistant"
  content: string
}

export default function StudyChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Hi 👋 I’m your study assistant. Ask me to explain concepts, summarize notes, or help with problems.",
    },
  ])

  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    })
  }, [messages])

  function sendMessage() {
    if (!input.trim()) return

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", content: input },
    ])
    setInput("")
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-800 overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-3 text-sm font-semibold text-slate-700">
          📘 Study Assistant
        </div>
      </header>

      {/* Chat Area */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="mx-auto max-w-4xl px-4 py-8 space-y-6 pb-32">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "rounded-xl px-4 py-3 text-sm leading-relaxed",
                  "max-w-[85%] sm:max-w-[70%]",
                  msg.role === "user"
                    ? "bg-indigo-500 text-white"
                    : "bg-slate-100 text-slate-800 border"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input Bar */}
      <div className="shrink-0 border-t bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-end gap-2 rounded-xl border bg-white px-3 py-2 focus-within:ring-1 focus-within:ring-indigo-400">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a study question, explain a topic, or paste notes…"
              className="min-h-[44px] resize-none border-0 focus-visible:ring-0 text-slate-700 placeholder:text-slate-400"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
            />

            <Button
              size="icon"
              onClick={sendMessage}
              disabled={!input.trim()}
              className="
                h-10 w-10 rounded-full
                bg-indigo-500 text-white
                shadow-sm
                transition
                hover:bg-indigo-600
                disabled:opacity-40
              "
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          </div>

          <p className="mt-2 text-center text-xs text-slate-400">
            Press Enter to send • Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
