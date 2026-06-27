export const traitKeys = [
  'analytical',
  'creative',
  'social',
  'leadership',
  'structured',
  'riskTaking',
  'handsOn',
  'digital',
  'research',
  'business'
] as const;

export type TraitKey = (typeof traitKeys)[number];
export type TraitVector = Record<TraitKey, number>;

export type QuestionOption = {
  id: string;
  label: string;
  description: string;
  weights: Partial<TraitVector>;
};

export type McqQuestion = {
  id: string;
  prompt: string;
  helper: string;
  options: QuestionOption[];
};

export type IntakeAgentOutput = {
  archetype: string;
  confidence: number;
  traitVector: TraitVector;
  topTraits: Array<{ trait: TraitKey; score: number }>;
  signals: string[];
};

export type ResumeAgentOutput = {
  provided: boolean;
  extractedSkills: string[];
  evidenceVector: TraitVector;
  summary: string[];
};

export type CareerRecommendation = {
  role: string;
  fitScore: number;
  salaryRange: string;
  marketDemand: 'Moderate' | 'High' | 'Very High';
  growthOutlook: string;
  whyFits: string[];
  concerns: string[];
  firstSprint: string[];
  missingSkills: string[];
};

export type RealityCheckOutput = {
  dreamRole: string | null;
  challengeQuestions: string[];
  blindSpots: string[];
};

export type CounselorSessionResult = {
  sessionId: string;
  generatedAt: string;
  interviewAgent: IntakeAgentOutput;
  resumeAgent: ResumeAgentOutput;
  realityCheckAgent: RealityCheckOutput;
  careerMatchAgent: {
    recommendations: CareerRecommendation[];
  };
  synthesis: {
    headline: string;
    counselorNarrative: string;
    firstWeekPlan: string[];
  };
};

export type CounselorSessionInput = {
  answers: Record<string, string>;
  resumeText?: string;
  dreamRole?: string;
};
