"use client"

import { useEffect, useRef, useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { ArrowUp, Square } from "lucide-react"
import { cn } from "@/lib/utils"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import "highlight.js/styles/github.css"

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
        "Hi! I’m your study assistant.\n\nAsk me to explain concepts, summarize notes, or show code examples.",
    },
  ])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const stopRef = useRef(false)
  const isAtBottomRef = useRef(true)

  // ---------------- Scroll detection ----------------
  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const threshold = 100
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
  }

  // ---------------- Auto scroll ----------------
  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // ---------------- Stop streaming ----------------
  const stopStreaming = () => {
    stopRef.current = true
    abortRef.current?.abort()
    setStreaming(false)
  }

  // ---------------- Send message ----------------
  const sendMessage = async () => {
    if (!input.trim() || streaming) return

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input,
    }

    const assistantMessage: Message = {
      id: Date.now() + 1,
      role: "assistant",
      content: "",
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setInput("")
    setStreaming(true)
    stopRef.current = false
    abortRef.current = new AbortController()

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        signal: abortRef.current.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(({ role, content }) => ({ role, content })),
        }),
      })

      if (!res.body) throw new Error("No stream")
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let displayed = ""

      // Faster smooth streaming
      while (true) {
        if (stopRef.current) break
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        while (buffer.length > 0) {
          if (stopRef.current) break
          // take 2 chars at once for faster rendering
          displayed += buffer.slice(0, 2)
          buffer = buffer.slice(2)

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id ? { ...m, content: displayed } : m
            )
          )

          // Auto scroll if at bottom
          if (isAtBottomRef.current) bottomRef.current?.scrollIntoView({ behavior: "smooth" })

          // Slight delay for smooth effect
          await new Promise((r) => setTimeout(r, 10))
        }
      }
    } catch {
      if (!stopRef.current) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id ? { ...m, content: "⚠️ Error generating response." } : m
          )
        )
      }
    } finally {
      setStreaming(false)
    }
  }

  // ---------------- UI ----------------
  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900 overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b bg-white/80 backdrop-blur shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-3 font-semibold text-sm">
          📘 Study Assistant
        </div>
      </header>

      {/* Chat */}
      <ScrollArea className="flex-1 min-h-0 bg-slate-50">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="mx-auto max-w-4xl px-4 py-8 space-y-4 pb-32 overflow-auto"
        >
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
                  "rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm",
                  "max-w-[85%] sm:max-w-[70%]",
                  msg.role === "user"
                    ? "bg-indigo-500 text-white"
                    : "bg-white border border-slate-200"
                )}
              >
                {msg.content ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      code({ inline, children }: any) {
                        if (inline) {
                          return (
                            <code className="rounded bg-slate-200 px-1 py-0.5 text-sm">
                              {children}
                            </code>
                          )
                        }
                        return (
                          <pre className="my-2 overflow-x-auto rounded-lg bg-slate-900 p-3 text-sm text-slate-100">
                            <code>{children}</code>
                          </pre>
                        )
                      },
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <span className="animate-pulse text-slate-400">Thinking…</span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="shrink-0 border-t bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-end gap-2 rounded-xl border bg-white px-3 py-2 focus-within:ring-1 focus-within:ring-indigo-400">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a study question…"
              className="min-h-[44px] resize-none border-0 focus-visible:ring-0"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
            />

            {/* Stable button */}
            <Button
              size="icon"
              onClick={() => {
                if (streaming) stopStreaming()
                else sendMessage()
              }}
              disabled={!input.trim() && !streaming}
              className={cn(
                "h-10 w-10 rounded-full text-white transition-colors duration-200",
                streaming ? "bg-red-500 hover:bg-red-600" : "bg-indigo-500 hover:bg-indigo-600",
                !input.trim() && !streaming ? "opacity-40 cursor-not-allowed" : ""
              )}
            >
              {streaming ? <Square className="h-4 w-4" /> : <ArrowUp className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
