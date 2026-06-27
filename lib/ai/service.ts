import Groq from 'groq-sdk';
import { env } from '@/lib/env';
import { aiProvider, getModelName } from '@/lib/ai/provider';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
type RuntimeProvider = 'groq' | 'gemini';

const groqClient = env.GROQ_API_KEY ? new Groq({ apiKey: env.GROQ_API_KEY }) : null;
const runtimeProviderState: {
  activeProvider: RuntimeProvider;
  switchedFromGroq: boolean;
  groqDisabledUntil: number;
} = {
  activeProvider: aiProvider === 'gemini' ? 'gemini' : 'groq',
  switchedFromGroq: aiProvider === 'gemini',
  groqDisabledUntil: 0
};

async function callGroq(messages: ChatMessage[], userGroqApiKey?: string) {
  let client: Groq | null = groqClient;
  if (userGroqApiKey) {
    client = new Groq({ apiKey: userGroqApiKey });
  }
  if (!client) throw new Error('GROQ_API_KEY is missing.');
  const completion = await client.chat.completions.create({
    model: getModelName('groq'),
    messages,
    temperature: 0.4
  });
  return completion.choices[0]?.message?.content ?? '';
}

function normalizeGeminiModelName(model: string) {
  return model.replace(/^models\//i, '').trim();
}

function buildGeminiModelCandidates() {
  const configured = normalizeGeminiModelName(getModelName('gemini'));
  const fallbackFromEnv = env.GEMINI_FALLBACK_MODELS.split(',')
    .map((model) => normalizeGeminiModelName(model))
    .filter(Boolean);
  return [...new Set([configured, ...fallbackFromEnv])];
}

function summarizeErrorBody(raw: string) {
  try {
    const parsed = JSON.parse(raw) as {
      error?: { message?: string };
    };
    return parsed.error?.message?.trim() || raw.trim();
  } catch {
    return raw.trim();
  }
}

async function callGeminiWithModel(model: string, prompt: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4 }
      })
    }
  );

  if (response.ok) {
    const json = await response.json();
    return {
      ok: true as const,
      text: json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    };
  }

  const errorBody = await response.text();
  return {
    ok: false as const,
    status: response.status,
    reason: summarizeErrorBody(errorBody)
  };
}

async function fetchGeminiAvailableModels() {
  if (!env.GEMINI_API_KEY) {
    return [] as string[];
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${env.GEMINI_API_KEY}`,
    { method: 'GET' }
  );

  if (!response.ok) {
    return [] as string[];
  }

  const payload = (await response.json()) as {
    models?: Array<{
      name?: string;
      supportedGenerationMethods?: string[];
    }>;
  };

  return (payload.models ?? [])
    .filter((model) => (model.supportedGenerationMethods ?? []).includes('generateContent'))
    .map((model) => normalizeGeminiModelName(model.name ?? ''))
    .filter((name) => name.toLowerCase().includes('gemini'));
}

async function callGemini(messages: ChatMessage[]) {
  if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is missing.');
  const prompt = messages.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join('\n\n');
  const attempted = new Set<string>();
  let lastRecoverableError = '';

  const tryCandidates = async (candidates: string[]) => {
    for (const model of candidates) {
      if (!model || attempted.has(model)) {
        continue;
      }
      attempted.add(model);

      const result = await callGeminiWithModel(model, prompt);
      if (result.ok) {
        return result.text;
      }

      if (result.status === 404 || result.status === 400) {
        lastRecoverableError = `Model "${model}" failed (${result.status}): ${result.reason}`;
        continue;
      }

      throw new Error(`Gemini request failed (${result.status}) with model "${model}": ${result.reason}`);
    }

    return null;
  };

  const configuredResult = await tryCandidates(buildGeminiModelCandidates());
  if (configuredResult !== null) {
    return configuredResult;
  }

  const discoveredResult = await tryCandidates(await fetchGeminiAvailableModels());
  if (discoveredResult !== null) {
    return discoveredResult;
  }

  throw new Error(`Gemini request failed for all candidate models. ${lastRecoverableError}`);
}

function isRateLimitError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const maybeStatus = (error as { status?: unknown }).status;
  if (maybeStatus === 429) {
    return true;
  }

  const message = error.message.toLowerCase();
  return message.includes('rate limit') || message.includes('rate_limit_exceeded') || message.includes('429');
}

function isQuotaOrLimitError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    isRateLimitError(error) ||
    message.includes('tokens per day') ||
    message.includes('quota') ||
    message.includes('resource_exhausted') ||
    message.includes('daily')
  );
}

function isGroqUnavailable(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.toLowerCase().includes('groq_api_key is missing');
}

function isGeminiUnavailable(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes('gemini_api_key is missing') ||
    message.includes('gemini request failed') ||
    message.includes('failed for all candidate models')
  );
}

function parseGroqRetryAfterMs(error: unknown) {
  if (!(error instanceof Error)) {
    return null;
  }

  const message = error.message.toLowerCase();
  const match = message.match(/try again in\s+(\d+)m(\d+(?:\.\d+)?)s/i);
  if (!match) {
    return null;
  }

  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  if (Number.isNaN(minutes) || Number.isNaN(seconds)) {
    return null;
  }

  return Math.round((minutes * 60 + seconds) * 1000);
}

function markGroqUnavailableForSession(error: unknown) {
  runtimeProviderState.activeProvider = 'gemini';

  if (!runtimeProviderState.switchedFromGroq) {
    runtimeProviderState.switchedFromGroq = true;
    console.warn('Groq unavailable this session. Switching to Gemini for subsequent requests.');
  }

  const retryAfterMs = parseGroqRetryAfterMs(error);
  const fallbackDisableMs = isQuotaOrLimitError(error) ? 60 * 60 * 1000 : 20 * 60 * 1000;
  runtimeProviderState.groqDisabledUntil = Date.now() + (retryAfterMs ?? fallbackDisableMs);
}

function buildBothUnavailableError(groqError: unknown, geminiError: unknown) {
  if (
    (isQuotaOrLimitError(groqError) || isGroqUnavailable(groqError)) &&
    (isQuotaOrLimitError(geminiError) || isGeminiUnavailable(geminiError))
  ) {
    return new Error('BOTH_API_KEYS_UNAVAILABLE');
  }

  if (geminiError instanceof Error) {
    return geminiError;
  }
  if (groqError instanceof Error) {
    return groqError;
  }
  return new Error('AI providers are currently unavailable.');
}

function canTryGroqNow(userGroqApiKey?: string) {
  return (Boolean(env.GROQ_API_KEY) || Boolean(userGroqApiKey)) && Date.now() >= runtimeProviderState.groqDisabledUntil;
}

export async function generateText(messages: ChatMessage[], userGroqApiKey?: string) {
  // First, try user-provided Groq API key if available - NO runtime restrictions here!
  if (userGroqApiKey) {
    try {
      return await callGroq(messages, userGroqApiKey);
    } catch (groqError) {
      // If user's own key fails, just throw the error directly - don't wrap in BOTH_API_KEYS_UNAVAILABLE!
      throw groqError;
    }
  }

  let groqError: unknown = null;
  let geminiError: unknown = null;

  // Try default Groq API key
  if (canTryGroqNow()) {
    try {
      return await callGroq(messages);
    } catch (err) {
      groqError = err;
      markGroqUnavailableForSession(err);
    }
  } else {
    // If Groq is already unavailable or no default key, set a dummy groqError that passes isGroqUnavailable
    groqError = new Error('GROQ_API_KEY is missing.');
  }

  // Try default Gemini API key
  try {
    return await callGemini(messages);
  } catch (err) {
    geminiError = err;
  }

  // If both failed, throw BOTH_API_KEYS_UNAVAILABLE
  if (groqError && geminiError) {
    throw buildBothUnavailableError(groqError, geminiError);
  }

  // If only one failed, throw that error
  if (groqError) throw groqError;
  throw geminiError;
}

export async function generateStructuredJson<T>(messages: ChatMessage[], fallback: T, userGroqApiKey?: string): Promise<T> {
  const content = await generateText(messages, userGroqApiKey);
  try {
    const parsed = JSON.parse(content.replace(/```json|```/g, '').trim()) as T;
    return parsed;
  } catch {
    return fallback;
  }
}
