import "server-only";
import { serverEnv } from "@/lib/env";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

async function complete(messages: ChatMessage[], temperature: number, json: boolean, maxTokens?: number): Promise<string> {
  const { OPENROUTER_API_KEY, OPENROUTER_MODEL } = serverEnv();

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "X-Title": "AgentMatch",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      temperature,
      ...(maxTokens ? { max_tokens: maxTokens } : {}),
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenRouter returned ${response.status}: ${body.slice(0, 500)}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("OpenRouter returned no message content");
  return content.trim();
}

export async function chatText(messages: ChatMessage[], temperature = 0.8, maxTokens?: number): Promise<string> {
  return complete(messages, temperature, false, maxTokens);
}

export async function chatJson(messages: ChatMessage[], temperature = 0.4): Promise<unknown> {
  const content = await complete(messages, temperature, true);
  try {
    return JSON.parse(content);
  } catch {
    throw new Error(`OpenRouter returned invalid JSON: ${content.slice(0, 300)}`);
  }
}
