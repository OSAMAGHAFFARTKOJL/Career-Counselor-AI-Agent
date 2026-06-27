import { generateText } from '@/lib/ai/service';
import { simulationPrompt } from '@/lib/prompts/simulation';

export async function simulateCareerDay(context: string, userGroqApiKey?: string) {
  return generateText([
    { role: 'system', content: simulationPrompt },
    { role: 'user', content: context }
  ], userGroqApiKey);
}
