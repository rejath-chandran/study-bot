import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: "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",
  baseURL: "https://api.groq.com/openai/v1",
})
export async function POST(req: Request) {
  const { messages }:any = await req.json()

  const stream = await openai.chat.completions.create({
     model: "openai/gpt-oss-20b",
    temperature: 0.4,
    stream: true,
    messages: [
      {
        role: "system",
        content:
          "You are a calm study assistant. Explain concepts step-by-step using simple language, bullet points, and examples. Avoid emojis.",
      },
      ...messages,
    ],
  })

  const encoder = new TextEncoder()

  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const token = chunk.choices[0]?.delta?.content
          if (token) {
            controller.enqueue(encoder.encode(token))
          }
        }
        controller.close()
      },
    }),
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    }
  )
}
