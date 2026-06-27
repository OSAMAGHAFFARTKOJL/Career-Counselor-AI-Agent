export type AiProvider = 'groq' | 'gemini';

export type AgentResult<T> = {
  data: T;
  model: string;
  provider: AiProvider;
};

export type CareerTag = {
  name: string;
  description: string;
  score: number;
};

export type CareerOption = {
  title: string;
  confidenceScore: number;
  whyItMatches: string[];
  requiredSkills: string[];
  salaryRange: string;
  marketDemand: 'Low' | 'Moderate' | 'High' | 'Very High';
  futureGrowth: string;
  companies: string[];
  pros: string[];
  cons: string[];
  dayInLife: string[];
};

export type Roadmap = {
  dailyPlan: string[];
  weeklyPlan: string[];
  monthlyPlan: string[];
  projects: string[];
  courses: string[];
  books: string[];
  certifications: string[];
  interviewPreparation: string[];
};