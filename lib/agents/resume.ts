import { generateStructuredJson } from '@/lib/ai/service';
import { resumePrompt } from '@/lib/prompts/resume';

export type ResumeAnalysis = {
  skills: string[];
  education: string[];
  projects: string[];
  leadership: string[];
  achievements: string[];
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
};

export async function analyzeResume(resumeText: string, userGroqApiKey?: string): Promise<ResumeAnalysis> {
  return generateStructuredJson(
    [
      { role: 'system', content: resumePrompt },
      { role: 'user', content: resumeText }
    ],
    {
      skills: [],
      education: [],
      projects: [],
      leadership: [],
      achievements: [],
      strengths: [],
      weaknesses: [],
      missingSkills: []
    },
    userGroqApiKey
  );
}
