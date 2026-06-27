import { generateStructuredJson } from '@/lib/ai/service';
import { careerPrompt } from '@/lib/prompts/career';
import type { CareerOption } from '@/types';

export async function recommendCareer(context: string, userGroqApiKey?: string): Promise<{ careers: CareerOption[] }> {
  return generateStructuredJson(
    [
      { role: 'system', content: careerPrompt },
      { role: 'user', content: context }
    ],
    {
      careers: []
    },
    userGroqApiKey
  );
}
