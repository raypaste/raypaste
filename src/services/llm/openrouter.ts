import type { LLMClient, LLMCompletion, LLMRequest } from "./types";

const BASE_URL = "https://openrouter.ai/api/v1/chat/completions";
const EXTRA_HEADERS = {
  "HTTP-Referer": "https://raypaste.com",
  "X-Title": "Raypaste",
};

async function parseSSEStream(
  body: ReadableStream<Uint8Array>,
  onChunk: (text: string) => void,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const raw = line.slice(5).trim();
      if (raw === "[DONE]") {
        break;
      }

      try {
        const chunk = JSON.parse(raw);
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) {
          onChunk(delta as string);
        }
      } catch {
        // ignore malformed chunks
      }
    }
  }
}

export const openrouterClient: LLMClient = {
  async complete(
    req: LLMRequest,
    apiKey: string,
    signal?: AbortSignal,
  ): Promise<LLMCompletion> {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...EXTRA_HEADERS,
      },
      body: JSON.stringify({ ...req, stream: false }),
      signal,
    });
    if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);

    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    return {
      text: data.choices[0].message.content,
      usage: {
        input_tokens: data.usage?.prompt_tokens ?? null,
        output_tokens: data.usage?.completion_tokens ?? null,
      },
    };
  },

  async stream(
    req: LLMRequest,
    apiKey: string,
    onChunk: (text: string) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...EXTRA_HEADERS,
      },
      body: JSON.stringify({ ...req, stream: true }),
      signal,
    });
    if (!res.ok) {
      throw new Error(`OpenRouter error: ${res.status}`);
    }

    await parseSSEStream(res.body!, onChunk);
  },
};
