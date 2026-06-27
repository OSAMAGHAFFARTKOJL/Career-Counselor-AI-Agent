import { generateStructuredJson } from '@/lib/ai/service';
import { psychologistPrompt } from '@/lib/prompts/psychologist';

export type PsychologistTurn = {
  followUpQuestion: string;
  rationale: string;
};

export async function discoverPersonality(context: string, userGroqApiKey?: string): Promise<PsychologistTurn> {
  return generateStructuredJson(
    [
      { role: 'system', content: psychologistPrompt },
      { role: 'user', content: context }
    ],
    {
      followUpQuestion: 'What kind of work leaves you energized at the end of the day?',
      rationale: 'This clarifies motivation and work style.'
    },
    userGroqApiKey
  );
}
