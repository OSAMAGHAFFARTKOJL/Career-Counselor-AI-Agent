import { careerTracks } from '@/lib/counselor/career-tracks';
import { counselorQuestions } from '@/lib/counselor/question-bank';
import type {
  CareerRecommendation,
  IntakeAgentOutput,
  RealityCheckOutput,
  ResumeAgentOutput,
  TraitKey,
  TraitVector
} from '@/lib/counselor/types';
import { traitKeys } from '@/lib/counselor/types';

const traitLabels: Record<TraitKey, string> = {
  analytical: 'Analytical Thinking',
  creative: 'Creative Expression',
  social: 'Human Interaction',
  leadership: 'Leadership Drive',
  structured: 'Execution Discipline',
  riskTaking: 'Risk Appetite',
  handsOn: 'Hands-on Building',
  digital: 'Digital Fluency',
  research: 'Research Orientation',
  business: 'Business Sense'
};

const resumeKeywordsByTrait: Record<TraitKey, string[]> = {
  analytical: ['analysis', 'analytics', 'optimization', 'metric', 'kpi', 'problem solving'],
  creative: ['design', 'content', 'branding', 'storytelling', 'creative', 'prototype'],
  social: ['collaboration', 'communication', 'community', 'mentoring', 'facilitation', 'stakeholder'],
  leadership: ['lead', 'managed', 'owner', 'captain', 'initiated', 'strategy'],
  structured: ['process', 'planning', 'timeline', 'operations', 'workflow', 'execution'],
  riskTaking: ['startup', 'experiment', 'pivot', 'launch', 'hackathon', 'venture'],
  handsOn: ['built', 'implemented', 'deployed', 'project', 'delivery', 'maker'],
  digital: ['python', 'sql', 'javascript', 'typescript', 'react', 'api', 'automation'],
  research: ['research', 'survey', 'interview', 'hypothesis', 'study', 'insight'],
  business: ['sales', 'growth', 'market', 'revenue', 'strategy', 'customer']
};

function createZeroVector(): TraitVector {
  return {
    analytical: 0,
    creative: 0,
    social: 0,
    leadership: 0,
    structured: 0,
    riskTaking: 0,
    handsOn: 0,
    digital: 0,
    research: 0,
    business: 0
  };
}

function topTraitsFromVector(vector: TraitVector) {
  return [...traitKeys]
    .map((trait) => ({ trait, score: Math.round(vector[trait]) }))
    .sort((a, b) => b.score - a.score);
}

function inferArchetype(topTraits: Array<{ trait: TraitKey; score: number }>) {
  const dominant = topTraits[0]?.trait;
  const second = topTraits[1]?.trait;

  if ((dominant === 'analytical' && second === 'digital') || (dominant === 'digital' && second === 'analytical')) {
    return 'Systems Analyst';
  }

  if ((dominant === 'creative' && second === 'social') || (dominant === 'social' && second === 'creative')) {
    return 'Human-Centered Creator';
  }

  if ((dominant === 'leadership' && second === 'business') || (dominant === 'business' && second === 'leadership')) {
    return 'Strategic Operator';
  }

  if ((dominant === 'research' && second === 'social') || (dominant === 'social' && second === 'research')) {
    return 'Insight Navigator';
  }

  if ((dominant === 'handsOn' && second === 'riskTaking') || (dominant === 'riskTaking' && second === 'handsOn')) {
    return 'Builder Explorer';
  }

  if ((dominant === 'structured' && second === 'analytical') || (dominant === 'analytical' && second === 'structured')) {
    return 'Execution Architect';
  }

  return 'Adaptive Generalist';
}

export function runIntakeAgent(answers: Record<string, string>): IntakeAgentOutput {
  const rawVector = createZeroVector();
  let answeredCount = 0;

  for (const question of counselorQuestions) {
    const selectedOptionId = answers[question.id];
    if (!selectedOptionId) {
      continue;
    }

    const selectedOption = question.options.find((option) => option.id === selectedOptionId);
    if (!selectedOption) {
      continue;
    }

    answeredCount += 1;

    for (const trait of traitKeys) {
      rawVector[trait] += selectedOption.weights[trait] ?? 0;
    }
  }

  const maxTraitValue = Math.max(...traitKeys.map((trait) => rawVector[trait]), 1);
  const normalizedVector = createZeroVector();

  for (const trait of traitKeys) {
    normalizedVector[trait] = Math.round((rawVector[trait] / maxTraitValue) * 100);
  }

  const rankedTraits = topTraitsFromVector(normalizedVector);
  const dominance = Math.max(0, (rankedTraits[0]?.score ?? 0) - (rankedTraits[2]?.score ?? 0));
  const targetQuestionCount = Math.min(counselorQuestions.length, 10);
  const completion = Math.min(1, answeredCount / Math.max(1, targetQuestionCount));
  const confidence = Math.min(100, Math.round(completion * 70 + dominance * 0.3));

  const signals = rankedTraits.slice(0, 4).map((item) => `${traitLabels[item.trait]} (${item.score}%)`);

  return {
    archetype: inferArchetype(rankedTraits),
    confidence,
    traitVector: normalizedVector,
    topTraits: rankedTraits,
    signals
  };
}

export function runResumeEvidenceAgent(resumeText: string | undefined): ResumeAgentOutput {
  if (!resumeText || !resumeText.trim()) {
    return {
      provided: false,
      extractedSkills: [],
      evidenceVector: createZeroVector(),
      summary: ['No resume text provided. Recommendations are based on MCQ signals only.']
    };
  }

  const content = resumeText.toLowerCase();
  const keywordHits: Record<TraitKey, number> = createZeroVector();
  const extractedSkills = new Set<string>();

  for (const trait of traitKeys) {
    for (const keyword of resumeKeywordsByTrait[trait]) {
      if (content.includes(keyword)) {
        keywordHits[trait] += 1;
        extractedSkills.add(keyword);
      }
    }
  }

  const evidenceVector = createZeroVector();
  for (const trait of traitKeys) {
    evidenceVector[trait] = Math.min(100, keywordHits[trait] * 18);
  }

  const rankedEvidence = topTraitsFromVector(evidenceVector).filter((item) => item.score > 0);
  const summary =
    rankedEvidence.length === 0
      ? ['Resume provided, but only weak keyword evidence detected. MCQ signals will dominate.']
      : rankedEvidence.slice(0, 3).map((item) => `Strong evidence for ${traitLabels[item.trait]} from resume activity.`);

  return {
    provided: true,
    extractedSkills: [...extractedSkills].slice(0, 16),
    evidenceVector,
    summary
  };
}

function mergeVectors(primary: TraitVector, secondary: TraitVector): TraitVector {
  const merged = createZeroVector();

  for (const trait of traitKeys) {
    merged[trait] = Math.round(primary[trait] * 0.75 + secondary[trait] * 0.25);
  }

  return merged;
}

function roleSimilarityScore(targetRole: string | undefined, candidateRole: string) {
  if (!targetRole || !targetRole.trim()) {
    return 0;
  }

  const targetTokens = targetRole
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 2);
  const candidate = candidateRole.toLowerCase();
  const overlap = targetTokens.filter((token) => candidate.includes(token)).length;

  return overlap > 0 ? Math.min(8, overlap * 4) : 0;
}

function buildRecommendation(
  role: string,
  fitScore: number,
  mission: string,
  salaryRange: string,
  marketDemand: 'Moderate' | 'High' | 'Very High',
  growthOutlook: string,
  strongestTraits: string[],
  matchedSignals: string[],
  concerns: string[],
  firstSprint: string[],
  missingSkills: string[]
): CareerRecommendation {
  const whyFits = [
    `${role} aligns with your strongest traits: ${strongestTraits.join(', ')}.`,
    mission
  ];

  if (matchedSignals.length > 0) {
    whyFits.push(`Resume evidence also supports this path via: ${matchedSignals.join(', ')}.`);
  }

  return {
    role,
    fitScore,
    salaryRange,
    marketDemand,
    growthOutlook,
    whyFits,
    concerns,
    firstSprint,
    missingSkills
  };
}

export function runCareerMatchAgent(
  intakeVector: TraitVector,
  resumeVector: TraitVector,
  extractedSkills: string[],
  dreamRole?: string
) {
  const blendedVector = mergeVectors(intakeVector, resumeVector);

  const recommendations = careerTracks
    .map((track) => {
      const weighted = (Object.entries(track.weights) as Array<[TraitKey, number | undefined]>).reduce<number>((sum, [trait, weight]) => {
        return sum + blendedVector[trait] * (weight ?? 0);
      }, 0);

      const maxWeighted = (Object.values(track.weights) as Array<number | undefined>).reduce<number>((sum, weight) => sum + (weight ?? 0), 0) * 100;
      const baseScore = maxWeighted > 0 ? (weighted / maxWeighted) * 100 : 0;

      const matchedSignals = track.signalKeywords.filter((keyword) => extractedSkills.includes(keyword));
      const keywordBonus = Math.min(10, matchedSignals.length * 2.5);
      const dreamBonus = roleSimilarityScore(dreamRole, track.role);
      const fitScore = Math.min(99, Math.round(baseScore + keywordBonus + dreamBonus));

      const strongTraits = [...traitKeys]
        .filter((trait) => (track.weights[trait] ?? 0) >= 0.65)
        .sort((a, b) => blendedVector[b] - blendedVector[a])
        .slice(0, 3)
        .map((trait) => traitLabels[trait]);

      const concernTraits = [...traitKeys]
        .filter((trait) => (track.weights[trait] ?? 0) >= 0.75 && blendedVector[trait] < 45)
        .map((trait) => `${traitLabels[trait]} is currently low for this role.`);

      const normalizedSkills = extractedSkills.map((skill) => skill.toLowerCase());
      const missingSkills = track.requiredSkills.filter((skill) => {
        return !normalizedSkills.some((item) => item.includes(skill.toLowerCase()));
      });

      const concernSkills = missingSkills.slice(0, 2).map((skill) => `You still need proof of ${skill}.`);
      const concerns = [...concernTraits, ...concernSkills].slice(0, 3);

      return buildRecommendation(
        track.role,
        fitScore,
        track.mission,
        track.salaryRange,
        track.marketDemand,
        track.growthOutlook,
        strongTraits,
        matchedSignals,
        concerns,
        track.firstSprint,
        missingSkills.slice(0, 4)
      );
    })
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, 4);

  return { recommendations, blendedVector };
}

export function runRealityCheckAgent(
  dreamRole: string | undefined,
  recommendations: CareerRecommendation[],
  topTraits: Array<{ trait: TraitKey; score: number }>
): RealityCheckOutput {
  const dominantTraits = topTraits.slice(0, 2).map((item) => traitLabels[item.trait]);
  const topRole = recommendations[0]?.role ?? 'the top recommendation';
  const dreamRoleNormalized = dreamRole?.trim();

  const challengeQuestions = [
    `If ${topRole} was unavailable for 2 years, what would be your second-best path and why?`,
    `Which weekly task from ${topRole} would energize you, and which one would drain you?`,
    `What real project can you ship in 14 days to validate fit instead of guessing?`,
    `Who can give you brutally honest feedback after that experiment?`
  ];

  const blindSpots = [
    `Your strongest identity signals are ${dominantTraits.join(' and ')}. Make sure your chosen path uses both.`,
    'Do not optimize for title only. Optimize for daily work you can sustain for years.'
  ];

  if (dreamRoleNormalized) {
    const inTopRecommendations = recommendations.some((item) => item.role.toLowerCase() === dreamRoleNormalized.toLowerCase());
    if (!inTopRecommendations) {
      blindSpots.push(
        `Your desired role "${dreamRoleNormalized}" is not currently top-ranked. Validate with a small experiment before committing.`
      );
    }
  }

  return {
    dreamRole: dreamRoleNormalized ?? null,
    challengeQuestions,
    blindSpots
  };
}
