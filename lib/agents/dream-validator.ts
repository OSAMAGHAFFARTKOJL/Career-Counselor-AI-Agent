import { generateText } from '@/lib/ai/service';

export async function validateDreamCareer(context: string, userGroqApiKey?: string) {
  const system = 'You are the Dream Validator Agent. Challenge the stated dream career with respectful, probing questions until the motivation is clear. If a better fit emerges, explain why politely.';
  return generateText([
    { role: 'system', content: system },
    { role: 'user', content: context }
  ], userGroqApiKey);
}
