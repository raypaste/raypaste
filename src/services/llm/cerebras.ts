import type { LLMClient, LLMCompletion, LLMRequest } from "./types";
import { chatCompletionBody } from "./chatCompletionBody";

const BASE_URL = "https://api.cerebras.ai/v1/chat/completions";

/**
 * Settings UI uses OpenRouter-style model ids. Cerebras Inference API expects
 * its own ids (see https://inference-docs.cerebras.ai/models/overview).
 */
function toCerebrasModelId(model: string): string {
  switch (model) {
    case "meta-llama/llama-3.1-8b-instruct":
      return "llama3.1-8b";
    case "openai/gpt-oss-120b":
      return "gpt-oss-120b";
    default:
      return model;
  }
}

function cerebrasRequestBody(req: LLMRequest, stream: boolean) {
  const base = chatCompletionBody(req, stream);
  return { ...base, model: toCerebrasModelId(base.model) };
}

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
      if (!line.startsWith("data:")) {
        continue;
      }

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

export const cerebrasClient: LLMClient = {
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
      },
      body: JSON.stringify(cerebrasRequestBody(req, false)),
      signal,
    });
    if (!res.ok) {
      throw new Error(`Cerebras error: ${res.status}`);
    }
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
      },
      body: JSON.stringify(cerebrasRequestBody(req, true)),
      signal,
    });
    if (!res.ok) {
      throw new Error(`Cerebras error: ${res.status}`);
    }

    await parseSSEStream(res.body!, onChunk);
  },
};
