import { generateText } from '@/lib/ai/service';
import {
  runCareerMatchAgent,
  runIntakeAgent,
  runRealityCheckAgent,
  runResumeEvidenceAgent
} from '@/lib/counselor/agents';
import type { CounselorSessionInput, CounselorSessionResult } from '@/lib/counselor/types';

function createSessionId() {
  return globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildHeadline(archetype: string, topRole: string) {
  return `${archetype} profile: strongest near-term direction is ${topRole}.`;
}

async function buildCounselorNarrative(result: CounselorSessionResult, userGroqApiKey?: string) {
  const topRecommendation = result.careerMatchAgent.recommendations[0];
  if (!topRecommendation) {
    return 'Not enough data to generate a counseling narrative yet.';
  }

  const fallback = [
    `You show a ${result.interviewAgent.archetype} pattern with ${result.interviewAgent.confidence}% confidence.`,
    `Your most suitable immediate direction is ${topRecommendation.role} (${topRecommendation.fitScore}% fit).`,
    `The next milestone is to run one 14-day proof project before making a high-stakes commitment.`
  ].join(' ');

  try {
    const modelOutput = await generateText([
      {
        role: 'system',
        content:
          'You are a direct and practical career counselor. Keep the response under 120 words. Be specific, actionable, and honest.'
      },
      {
        role: 'user',
        content: `Create a short counselor summary from this JSON:\n${JSON.stringify(result)}`
      }
    ], userGroqApiKey);

    const cleaned = modelOutput.trim();
    return cleaned.length > 0 ? cleaned : fallback;
  } catch {
    return fallback;
  }
}

export async function runCounselorSession(input: CounselorSessionInput, userGroqApiKey?: string): Promise<CounselorSessionResult> {
  const interviewAgent = runIntakeAgent(input.answers);
  const resumeAgent = runResumeEvidenceAgent(input.resumeText);
  const { recommendations } = runCareerMatchAgent(
    interviewAgent.traitVector,
    resumeAgent.evidenceVector,
    resumeAgent.extractedSkills,
    input.dreamRole
  );
  const realityCheckAgent = runRealityCheckAgent(input.dreamRole, recommendations, interviewAgent.topTraits);

  const firstRecommendation = recommendations[0]?.role ?? 'career exploration';
  const firstWeekPlan = recommendations[0]?.firstSprint ?? [
    'Pick one role and complete one tiny project to test fit.',
    'Get feedback from one mentor or professional.',
    'Reflect on energy level after doing real tasks from that role.'
  ];

  const result: CounselorSessionResult = {
    sessionId: createSessionId(),
    generatedAt: new Date().toISOString(),
    interviewAgent,
    resumeAgent,
    realityCheckAgent,
    careerMatchAgent: { recommendations },
    synthesis: {
      headline: buildHeadline(interviewAgent.archetype, firstRecommendation),
      counselorNarrative: '',
      firstWeekPlan
    }
  };

  result.synthesis.counselorNarrative = await buildCounselorNarrative(result, userGroqApiKey);
  return result;
}
