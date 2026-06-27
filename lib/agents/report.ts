import { generateStructuredJson } from '@/lib/ai/service';
import { reportPrompt } from '@/lib/prompts/report';

export async function generateReport(context: string, userGroqApiKey?: string): Promise<Record<string, unknown>> {
  return generateStructuredJson(
    [
      { role: 'system', content: reportPrompt },
      { role: 'user', content: context }
    ],
    {},
    userGroqApiKey
  );
}
