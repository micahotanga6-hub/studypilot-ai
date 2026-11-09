import "server-only";
import { ApiError } from "@/lib/http";

interface GrokOptions {
  system: string;
  user: string;
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  maxTokens: number;
}

function modelName() {
  return process.env.XAI_MODEL?.trim() || "grok-4.7";
}

function baseUrl() {
  return (process.env.XAI_BASE_URL?.trim() || "https://api.x.ai/v1").replace(/\/$/, "");
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return trimmed;
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

function failure(status: number, body: { error?: { message?: string } }): ApiError {
  const raw = typeof body?.error?.message === "string" ? body.error.message.slice(0, 280) : "";
  if (status === 401 || status === 403) {
    return new ApiError(502, "The Grok API key was rejected. Check XAI_API_KEY.");
  }
  if (status === 404 || (/model/i.test(raw) && /not found|does not exist|invalid model/i.test(raw))) {
    return new ApiError(502, `The model “${modelName()}” was not accepted. Set XAI_MODEL to a model your xAI account can use.`);
  }
  if (status === 429) {
    return new ApiError(429, "The study model is limiting requests right now. Wait a minute and try again.");
  }
  return new ApiError(502, raw || `The study model returned an error (${status}).`);
}

async function complete(options: GrokOptions, format: "schema" | "object") {
  const key = process.env.XAI_API_KEY?.trim();
  if (!key) {
    throw new ApiError(503, "The Grok API key is not configured. Add XAI_API_KEY on the server.");
  }
  const responseFormat =
    format === "schema"
      ? {
          type: "json_schema",
          json_schema: { name: options.schemaName, strict: true, schema: options.jsonSchema },
        }
      : { type: "json_object" };
  const payload: Record<string, unknown> = {
    model: modelName(),
    max_completion_tokens: options.maxTokens,
    messages: [
      { role: "system", content: options.system },
      { role: "user", content: options.user },
    ],
    response_format: responseFormat,
  };
  const effort = process.env.XAI_REASONING_EFFORT?.trim();
  if (effort) payload.reasoning_effort = effort;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55_000);
  try {
    const response = await fetch(`${baseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = (await response.json().catch(() => ({}))) as { choices?: { message?: { content?: string } }[]; error?: { message?: string } };
    return { response, body };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(504, "The study model took too long. Try a shorter document, or set XAI_MODEL to a faster model.");
    }
    throw new ApiError(502, "StudyPilot could not reach the Grok API. Check the server connection and try again.");
  } finally {
    clearTimeout(timer);
  }
}

export async function grokJson(options: GrokOptions): Promise<unknown> {
  let result = await complete(options, "schema");
  if (result.response.status === 400) {
    result = await complete(options, "object");
  }
  if (!result.response.ok) throw failure(result.response.status, result.body);
  const content = result.body.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new ApiError(502, "The study model returned an empty response. Try again.");
  }
  try {
    return JSON.parse(extractJson(content));
  } catch {
    throw new ApiError(502, "The study model returned text that was not valid JSON. Try again.");
  }
}

export async function generateValidated<T>(options: GrokOptions, parse: (data: unknown) => T): Promise<T> {
  let last = "The response did not match the expected shape.";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const user = attempt === 0 ? options.user : `${options.user}\n\nYour previous response could not be used (${last}). Return only JSON that matches the requested fields.`;
    try {
      const raw = await grokJson({ ...options, user });
      return parse(raw);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      last = error instanceof Error ? error.message : last;
    }
  }
  throw new ApiError(502, "StudyPilot could not produce a valid result from that material. Try again.");
}
