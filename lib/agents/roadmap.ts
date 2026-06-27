import { generateStructuredJson } from '@/lib/ai/service';
import { roadmapPrompt } from '@/lib/prompts/roadmap';
import type { Roadmap } from '@/types';

export async function generateRoadmap(context: string, userGroqApiKey?: string): Promise<Roadmap> {
  return generateStructuredJson(
    [
      { role: 'system', content: roadmapPrompt },
      { role: 'user', content: context }
    ],
    {
      dailyPlan: [],
      weeklyPlan: [],
      monthlyPlan: [],
      projects: [],
      courses: [],
      books: [],
      certifications: [],
      interviewPreparation: []
    },
    userGroqApiKey
  );
}
