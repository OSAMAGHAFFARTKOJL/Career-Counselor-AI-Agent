import { env } from '@/lib/env';
import type { AiProvider } from '@/types';

export const aiProvider: AiProvider = env.AI_PROVIDER;

export function getModelName(provider: AiProvider = aiProvider) {
  return provider === 'groq' ? env.GROQ_MODEL : env.GEMINI_MODEL;
}
