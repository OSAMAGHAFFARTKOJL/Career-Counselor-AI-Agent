import { generateStructuredJson, generateText } from '@/lib/ai/service';
import { runCareerMatchAgent, runResumeEvidenceAgent } from '@/lib/counselor/agents';
import { careerTracks } from '@/lib/counselor/career-tracks';
import { MAX_INTERVIEW_TURNS } from '@/lib/counselor/constants';
import type { CareerRecommendation, TraitVector } from '@/lib/counselor/types';
import { traitKeys } from '@/lib/counselor/types';

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export type AdaptiveQuestion = {
  id: string;
  type: 'mcq' | 'open';
  prompt: string;
  whyAsking: string;
  options?: Array<{ id: string; label: string }>;
};

export type AdaptiveInterviewTurn = {
  questionId: string;
  question: string;
  type: 'mcq' | 'open';
  whyAsking: string;
  options?: Array<{ id: string; label: string }>;
  answer: string;
  selectedOptionId?: string;
};

export type AdaptiveInterviewRequest = {
  dreamRole: string;
  resumeText?: string;
  history: AdaptiveInterviewTurn[];
};

type AdaptiveAnalysis = {
  confidence: number;
  primaryField: string;
  alternativeFields: string[];
  evidence: string[];
  contradictions: string[];
  needsMoreEvidence: boolean;
  missingChecks: string[];
  traitVector: TraitVector;
  interviewerThought: string;
  scoreGap: number;
  contradictionStrength: number;
  openAnswerCount: number;
};

type AdaptiveRoadmap = {
  immediate: string[];
  month1: string[];
  month2to3: string[];
  portfolioProjects: string[];
};

export type AdaptiveFinalReport = {
  headline: string;
  confidence: number;
  inferredPrimaryField: string;
  alternativeFields: string[];
  evidence: string[];
  contradictions: string[];
  counselorSummary: string;
  recommendations: CareerRecommendation[];
  roadmap: AdaptiveRoadmap;
};

export type AdaptiveInterviewResponse = {
  done: boolean;
  turns: number;
  maxTurns: number;
  confidence: number;
  interviewerThought: string;
  nextQuestion?: AdaptiveQuestion;
  finalReport?: AdaptiveFinalReport;
};

type TrackSignal = {
  role: string;
  combined: number;
  dream: number;
  resume: number;
  history: number;
  matchedKeywords: string[];
};

type RefinementResult = {
  evidence: string[];
  contradictions: string[];
  needsMoreEvidence: boolean;
  missingChecks: string[];
  interviewerThought: string;
};

type QuestionStrategy = {
  requiredType: 'mcq' | 'open';
  reason: string;
  focusField: string;
  alternativeField?: string;
  mode: 'resolve-contradiction' | 'disambiguate' | 'evidence-depth' | 'commitment-check';
};

function createNeutralTraitVector(): TraitVector {
  return {
    analytical: 50,
    creative: 50,
    social: 50,
    leadership: 50,
    structured: 50,
    riskTaking: 50,
    handsOn: 50,
    digital: 50,
    research: 50,
    business: 50
  };
}

function clampTraitVector(vector: TraitVector): TraitVector {
  const normalized = { ...vector };
  for (const key of traitKeys) {
    normalized[key] = Math.max(0, Math.min(100, Math.round(normalized[key] ?? 50)));
  }
  return normalized;
}

function compactHistory(history: AdaptiveInterviewTurn[]) {
  return history.map((turn, index) => ({
    turn: index + 1,
    question: turn.question,
    answer: turn.answer
  }));
}

function normalizeText(text: string | undefined) {
  return (text ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function tokenize(text: string) {
  return text
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length >= 3);
}

function uniqueList(items: string[]) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function countKeywordHits(text: string, keywords: string[]) {
  if (!text) {
    return 0;
  }

  return uniqueList(keywords)
    .filter((keyword) => keyword.length >= 3)
    .reduce((count, keyword) => (text.includes(keyword.toLowerCase()) ? count + 1 : count), 0);
}

function getHistoryAnswerText(history: AdaptiveInterviewTurn[]) {
  return history.map((turn) => turn.answer).join(' ');
}

function countMeaningfulOpenAnswers(history: AdaptiveInterviewTurn[]) {
  return history.filter((turn) => turn.type === 'open' && turn.answer.trim().split(/\s+/).length >= 8).length;
}

function scoreTracks(input: AdaptiveInterviewRequest): TrackSignal[] {
  const dream = normalizeText(input.dreamRole);
  const resume = normalizeText(input.resumeText);
  const historyText = normalizeText(getHistoryAnswerText(input.history));

  const hasResume = Boolean(resume);
  const hasHistory = Boolean(historyText);

  let dreamWeight = 0.34;
  let resumeWeight = hasResume ? 0.42 : 0;
  let historyWeight = hasHistory ? 0.24 : 0;
  const denominator = dreamWeight + resumeWeight + historyWeight || 1;
  dreamWeight /= denominator;
  resumeWeight /= denominator;
  historyWeight /= denominator;

  return [...careerTracks]
    .map((track) => {
      const roleText = track.role.toLowerCase();
      const roleTokens = tokenize(roleText);
      const keywordPool = uniqueList([
        track.role.toLowerCase(),
        ...track.signalKeywords.map((keyword) => keyword.toLowerCase()),
        ...track.requiredSkills.map((skill) => skill.toLowerCase()),
        ...roleTokens
      ]);

      const dreamOverlap = roleTokens.filter((token) => tokenize(dream).includes(token)).length;
      const dreamRatio = roleTokens.length > 0 ? dreamOverlap / roleTokens.length : 0;
      const dreamKeywordHits = countKeywordHits(dream, keywordPool);

      let dreamScore = dreamRatio * 75 + dreamKeywordHits * 6;
      if (dream === roleText) {
        dreamScore = 100;
      } else if (dream.includes(roleText) || roleText.includes(dream)) {
        dreamScore = Math.max(dreamScore, 86);
      }

      const resumeHits = countKeywordHits(resume, keywordPool);
      const historyHits = countKeywordHits(historyText, keywordPool);

      const resumeScore = clampNumber(resumeHits * 14 + (resume.includes(roleText) ? 18 : 0), 0, 100);
      const historyScore = clampNumber(historyHits * 16 + (historyText.includes(roleText) ? 18 : 0), 0, 100);

      const combined = Math.round(
        clampNumber(dreamScore, 0, 100) * dreamWeight +
          resumeScore * resumeWeight +
          historyScore * historyWeight
      );

      const matchedKeywords = keywordPool
        .filter((keyword) => keyword.length >= 4)
        .filter((keyword) => resume.includes(keyword) || historyText.includes(keyword))
        .slice(0, 6);

      return {
        role: track.role,
        combined,
        dream: Math.round(clampNumber(dreamScore, 0, 100)),
        resume: Math.round(resumeScore),
        history: Math.round(historyScore),
        matchedKeywords
      };
    })
    .sort((a, b) => b.combined - a.combined);
}

function topByScore(trackScores: TrackSignal[], key: 'dream' | 'resume' | 'history') {
  return [...trackScores].sort((a, b) => b[key] - a[key])[0];
}

function buildContradictions(trackScores: TrackSignal[]) {
  const contradictions: string[] = [];
  let contradictionStrength = 0;

  const topCombined = trackScores[0];
  const secondCombined = trackScores[1];
  const topDream = topByScore(trackScores, 'dream');
  const topResume = topByScore(trackScores, 'resume');
  const topHistory = topByScore(trackScores, 'history');

  if (topDream && topCombined && topDream.role !== topCombined.role && topDream.dream >= 45 && topCombined.combined >= 55) {
    contradictions.push(`Dream-role intent leans toward ${topDream.role}, but strongest combined evidence points to ${topCombined.role}.`);
    contradictionStrength += 24;
  }

  if (topDream && topResume && topResume.role !== topDream.role && topResume.resume >= 42) {
    contradictions.push(`Resume evidence is more aligned with ${topResume.role} than ${topDream.role}.`);
    contradictionStrength += 30;
  }

  if (topDream && topHistory && topHistory.role !== topDream.role && topHistory.history >= 36) {
    contradictions.push(`Interview answers sound closer to ${topHistory.role} than ${topDream.role}.`);
    contradictionStrength += 20;
  }

  if (topCombined && secondCombined && topCombined.combined - secondCombined.combined < 7) {
    contradictions.push(`Signals are still close between ${topCombined.role} and ${secondCombined.role}.`);
    contradictionStrength += 10;
  }

  return {
    contradictions: uniqueList(contradictions).slice(0, 6),
    contradictionStrength: clampNumber(contradictionStrength, 0, 100)
  };
}

function buildTraitVectorFromSignals(
  trackScores: TrackSignal[],
  resumeVector: TraitVector,
  historyVector: TraitVector
) {
  const topSignals = trackScores.slice(0, 4);
  const totalSignal = topSignals.reduce((sum, signal) => sum + signal.combined, 0) || 1;

  const roleWeighted = createNeutralTraitVector();
  for (const trait of traitKeys) {
    roleWeighted[trait] = Math.round(
      (topSignals.reduce((sum, signal) => {
        const track = careerTracks.find((item) => item.role === signal.role);
        const traitWeight = track?.weights[trait] ?? 0;
        return sum + traitWeight * signal.combined;
      }, 0) /
        totalSignal) *
        100
    );
  }

  const hasResumeSignal = Object.values(resumeVector).some((value) => value > 0);
  const hasHistorySignal = Object.values(historyVector).some((value) => value > 0);

  let neutralWeight = 0.2;
  let resumeWeight = hasResumeSignal ? 0.4 : 0;
  let historyWeight = hasHistorySignal ? 0.2 : 0;
  let roleWeight = 0.2;
  const weightSum = neutralWeight + resumeWeight + historyWeight + roleWeight || 1;

  neutralWeight /= weightSum;
  resumeWeight /= weightSum;
  historyWeight /= weightSum;
  roleWeight /= weightSum;

  const blended = createNeutralTraitVector();
  for (const trait of traitKeys) {
    blended[trait] = Math.round(
      createNeutralTraitVector()[trait] * neutralWeight +
        (resumeVector[trait] ?? 0) * resumeWeight +
        (historyVector[trait] ?? 0) * historyWeight +
        roleWeighted[trait] * roleWeight
    );
  }

  return clampTraitVector(blended);
}

function buildEvidenceLines(
  input: AdaptiveInterviewRequest,
  trackScores: TrackSignal[],
  resumeSummary: string[]
) {
  const lines: string[] = [];
  const topCombined = trackScores[0];
  const topResume = topByScore(trackScores, 'resume');
  const topHistory = topByScore(trackScores, 'history');

  if (input.dreamRole.trim()) {
    lines.push(`Initial aspiration entered: ${input.dreamRole.trim()}.`);
  }

  if (topCombined) {
    lines.push(`Strongest overall fit signal currently points to ${topCombined.role}.`);
  }

  if (input.resumeText?.trim() && topResume && topResume.resume >= 34) {
    lines.push(`Resume tasks and tools look most aligned with ${topResume.role}.`);
  }

  if (input.history.length > 0 && topHistory && topHistory.history >= 30) {
    lines.push(`Recent answers are most consistent with ${topHistory.role} daily work.`);
  }

  if (topCombined?.matchedKeywords.length) {
    lines.push(`Detected role-specific evidence: ${topCombined.matchedKeywords.slice(0, 4).join(', ')}.`);
  }

  lines.push(...resumeSummary);
  return uniqueList(lines).slice(0, 8);
}

function buildMissingChecks(input: AdaptiveInterviewRequest, analysisSeed: {
  scoreGap: number;
  contradictionStrength: number;
  primaryField: string;
  alternativeField?: string;
  openAnswerCount: number;
}) {
  const checks: string[] = [];
  const turns = input.history.length;

  if (turns < 3) {
    checks.push('Need more interaction rounds before finalizing direction.');
  }

  if (analysisSeed.openAnswerCount < 2 && turns >= 2) {
    checks.push('Need richer text evidence from at least one concrete project example.');
  }

  if (analysisSeed.scoreGap < 8 && analysisSeed.alternativeField) {
    checks.push(`Need one more disambiguation between ${analysisSeed.primaryField} and ${analysisSeed.alternativeField}.`);
  }

  if (analysisSeed.contradictionStrength >= 35) {
    checks.push('Need to confirm if motivation matches long-term weekly task reality.');
  }

  if (!input.resumeText?.trim()) {
    checks.push('Resume was not uploaded, so capability evidence is weaker.');
  }

  return uniqueList(checks).slice(0, 6);
}

function buildInterviewerThought(analysis: Pick<AdaptiveAnalysis, 'contradictions' | 'scoreGap' | 'needsMoreEvidence' | 'confidence'>) {
  if (analysis.contradictions.length > 0) {
    return 'Conflicting signals detected; validating sustained task preference before final verdict.';
  }

  if (analysis.scoreGap < 8) {
    return 'Top fields are close; one focused question can resolve direction reliably.';
  }

  if (analysis.needsMoreEvidence) {
    return 'Profile is forming; collecting one more concrete behavior example for confidence.';
  }

  if (analysis.confidence >= 84) {
    return 'Signal quality is high; final recommendation can be delivered soon.';
  }

  return 'Adaptive evidence is improving; continuing to verify fit and execution potential.';
}

function buildDeterministicAnalysis(input: AdaptiveInterviewRequest): AdaptiveAnalysis {
  const resumeEvidence = runResumeEvidenceAgent(input.resumeText);
  const historyEvidence = runResumeEvidenceAgent(getHistoryAnswerText(input.history));
  const trackScores = scoreTracks(input);
  const primaryField = trackScores[0]?.role || input.dreamRole.trim() || 'Generalist Path';
  const alternativeFields = trackScores
    .slice(1, 4)
    .map((score) => score.role)
    .filter((role) => role !== primaryField);
  const scoreGap = Math.max(0, (trackScores[0]?.combined ?? 0) - (trackScores[1]?.combined ?? 0));
  const openAnswerCount = countMeaningfulOpenAnswers(input.history);
  const contradictionReport = buildContradictions(trackScores);

  const missingChecks = buildMissingChecks(input, {
    scoreGap,
    contradictionStrength: contradictionReport.contradictionStrength,
    primaryField,
    alternativeField: alternativeFields[0],
    openAnswerCount
  });

  const turns = input.history.length;
  const needsMoreEvidence =
    turns < 4 ||
    contradictionReport.contradictionStrength >= 35 ||
    scoreGap < 8 ||
    (turns >= 3 && openAnswerCount < 1);

  const evidenceStrength = trackScores[0]?.combined ?? 45;
  const turnBonus = Math.min(24, turns * 3);
  const gapBonus = Math.min(16, scoreGap * 1.5);
  const openAnswerBonus = Math.min(10, openAnswerCount * 3);
  const contradictionPenalty = Math.min(24, contradictionReport.contradictionStrength * 0.28);
  const confidence = Math.round(
    clampNumber(32 + turnBonus + evidenceStrength * 0.24 + gapBonus + openAnswerBonus - contradictionPenalty, 30, 96)
  );

  const traitVector = buildTraitVectorFromSignals(
    trackScores,
    resumeEvidence.evidenceVector,
    historyEvidence.evidenceVector
  );
  const evidence = buildEvidenceLines(input, trackScores, resumeEvidence.summary);

  const deterministic: AdaptiveAnalysis = {
    confidence,
    primaryField,
    alternativeFields,
    evidence,
    contradictions: contradictionReport.contradictions,
    needsMoreEvidence,
    missingChecks,
    traitVector,
    interviewerThought: '',
    scoreGap,
    contradictionStrength: contradictionReport.contradictionStrength,
    openAnswerCount
  };

  deterministic.interviewerThought = buildInterviewerThought(deterministic);
  return deterministic;
}

async function inferAdaptiveAnalysis(input: AdaptiveInterviewRequest, userGroqApiKey?: string): Promise<AdaptiveAnalysis> {
  const deterministic = buildDeterministicAnalysis(input);
  const fallback: RefinementResult = {
    evidence: deterministic.evidence,
    contradictions: deterministic.contradictions,
    needsMoreEvidence: deterministic.needsMoreEvidence,
    missingChecks: deterministic.missingChecks,
    interviewerThought: deterministic.interviewerThought
  };

  const refinement = await generateStructuredJson<RefinementResult>(
    [
      {
        role: 'system',
        content:
          'You are an expert career counselor. Refine evidence and next-checks only. Do not rewrite core field scoring.'
      },
      {
        role: 'user',
        content: `Return JSON with keys:
evidence (string[]),
contradictions (string[]),
needsMoreEvidence (boolean),
missingChecks (string[]),
interviewerThought (string, under 24 words).

Current deterministic analysis:
${JSON.stringify({
          confidence: deterministic.confidence,
          primaryField: deterministic.primaryField,
          alternativeFields: deterministic.alternativeFields,
          evidence: deterministic.evidence,
          contradictions: deterministic.contradictions,
          needsMoreEvidence: deterministic.needsMoreEvidence,
          missingChecks: deterministic.missingChecks,
          scoreGap: deterministic.scoreGap,
          contradictionStrength: deterministic.contradictionStrength,
          openAnswerCount: deterministic.openAnswerCount
        })}

User aspiration: ${input.dreamRole}
Resume snippet: ${(input.resumeText ?? '').slice(0, 3000)}
History: ${JSON.stringify(compactHistory(input.history))}

Rules:
- Keep contradictions only if evidence supports them.
- Add at most 2 new items per list.
- Use practical interviewerThought.`
      }
    ],
    fallback,
    userGroqApiKey
  );

  const mergedEvidence = uniqueList([...(deterministic.evidence ?? []), ...(refinement.evidence ?? [])]).slice(0, 8);
  const mergedContradictions = uniqueList([...(deterministic.contradictions ?? []), ...(refinement.contradictions ?? [])]).slice(0, 6);
  const mergedChecks = uniqueList([...(deterministic.missingChecks ?? []), ...(refinement.missingChecks ?? [])]).slice(0, 6);

  const needsMoreEvidence = deterministic.needsMoreEvidence || Boolean(refinement.needsMoreEvidence);

  return {
    ...deterministic,
    evidence: mergedEvidence,
    contradictions: mergedContradictions,
    missingChecks: mergedChecks,
    needsMoreEvidence,
    interviewerThought: refinement.interviewerThought?.trim() || deterministic.interviewerThought
  };
}

function chooseQuestionStrategy(input: AdaptiveInterviewRequest, analysis: AdaptiveAnalysis): QuestionStrategy {
  const turns = input.history.length;
  const lastType = input.history[turns - 1]?.type;
  const alternativeField = analysis.alternativeFields[0];
  const contradictionActive = analysis.contradictionStrength >= 35 || analysis.contradictions.length > 0;
  const needsMoreOpenEvidence = turns >= 2 && analysis.openAnswerCount < 2;

  if (contradictionActive) {
    if (lastType !== 'open' || needsMoreOpenEvidence) {
      return {
        requiredType: 'open',
        reason: 'Resolving contradiction between aspiration and demonstrated evidence.',
        focusField: analysis.primaryField,
        alternativeField,
        mode: 'resolve-contradiction'
      };
    }

    return {
      requiredType: 'mcq',
      reason: 'Forcing a practical choice between competing field behaviors.',
      focusField: analysis.primaryField,
      alternativeField,
      mode: 'disambiguate'
    };
  }

  if (analysis.scoreGap < 7 && alternativeField) {
    return {
      requiredType: 'mcq',
      reason: 'Separating two close-fit fields quickly.',
      focusField: analysis.primaryField,
      alternativeField,
      mode: 'disambiguate'
    };
  }

  if (needsMoreOpenEvidence) {
    return {
      requiredType: 'open',
      reason: 'Collecting text evidence from real projects and motivation patterns.',
      focusField: analysis.primaryField,
      alternativeField,
      mode: 'evidence-depth'
    };
  }

  if (turns >= 4 && analysis.confidence >= 76) {
    return {
      requiredType: 'open',
      reason: 'Final commitment check before concluding recommendations.',
      focusField: analysis.primaryField,
      alternativeField,
      mode: 'commitment-check'
    };
  }

  if (lastType === 'open') {
    return {
      requiredType: 'mcq',
      reason: 'Converting narrative evidence into decision-ready preference.',
      focusField: analysis.primaryField,
      alternativeField,
      mode: 'disambiguate'
    };
  }

  return {
    requiredType: 'open',
    reason: 'Adding deeper context to avoid overfitting on short answers.',
    focusField: analysis.primaryField,
    alternativeField,
    mode: 'evidence-depth'
  };
}

function fallbackQuestion(input: AdaptiveInterviewRequest, analysis: AdaptiveAnalysis, strategy: QuestionStrategy): AdaptiveQuestion {
  const dreamRole = input.dreamRole.trim() || 'your current dream role';
  const fieldA = strategy.focusField;
  const fieldB = strategy.alternativeField ?? analysis.alternativeFields[0] ?? dreamRole;

  if (strategy.requiredType === 'mcq') {
    return {
      id: `q-${createId()}`,
      type: 'mcq',
      prompt:
        strategy.mode === 'disambiguate'
          ? `Which weekly workflow would you choose for the next 6 months?`
          : `Which pattern best matches your working style right now?`,
      whyAsking: strategy.reason,
      options: [
        { id: 'a', label: `Mostly ${fieldA} work with deep focus on its core tasks.` },
        { id: 'b', label: `Mostly ${fieldB} work with hands-on execution in that domain.` },
        { id: 'c', label: `A hybrid path combining both fields equally.` },
        { id: 'd', label: 'I am unsure and need short experiments before deciding.' }
      ]
    };
  }

  if (strategy.mode === 'resolve-contradiction') {
    return {
      id: `q-${createId()}`,
      type: 'open',
      prompt: `You mentioned "${dreamRole}", but evidence currently leans toward "${fieldA}". Which weekly tasks would you choose and sustain for 6 months?`,
      whyAsking: strategy.reason
    };
  }

  if (strategy.mode === 'commitment-check') {
    return {
      id: `q-${createId()}`,
      type: 'open',
      prompt: `If you commit to ${fieldA} for 90 days, what are the first two projects you would build and why?`,
      whyAsking: strategy.reason
    };
  }

  return {
    id: `q-${createId()}`,
    type: 'open',
    prompt: 'Share one real project where you felt most energized. What did you do yourself, with which tools, and what outcome did you create?',
    whyAsking: strategy.reason
  };
}

function isDuplicatePrompt(prompt: string, history: AdaptiveInterviewTurn[]) {
  const normalizedPrompt = normalizeText(prompt);
  return history.some((turn) => normalizeText(turn.question) === normalizedPrompt);
}

async function generateNextQuestion(input: AdaptiveInterviewRequest, analysis: AdaptiveAnalysis, userGroqApiKey?: string): Promise<AdaptiveQuestion> {
  const strategy = chooseQuestionStrategy(input, analysis);
  const fallback = fallbackQuestion(input, analysis, strategy);

  const generated = await generateStructuredJson<AdaptiveQuestion>(
    [
      {
        role: 'system',
          content:
          'You are an adaptive interviewer. Generate the single best next question to reduce uncertainty. Return strict JSON only.'
      },
      {
        role: 'user',
        content: `Return JSON with keys:
id (string),
type ("${strategy.requiredType}"),
prompt (string),
whyAsking (string, under 20 words),
options (required only for mcq, exactly 4 items with id and label).

Context:
- Dream role: ${input.dreamRole}
- Resume snippet: ${(input.resumeText ?? '').slice(0, 2200)}
- Current analysis: ${JSON.stringify({
          primaryField: analysis.primaryField,
          alternativeFields: analysis.alternativeFields,
          contradictions: analysis.contradictions,
          missingChecks: analysis.missingChecks,
          confidence: analysis.confidence,
          scoreGap: analysis.scoreGap,
          contradictionStrength: analysis.contradictionStrength,
          openAnswerCount: analysis.openAnswerCount
        })}
- Strategy: ${JSON.stringify(strategy)}
- History: ${JSON.stringify(compactHistory(input.history))}

Rules:
- Respect required type exactly.
- Ask counter-question if answers conflict with dream role.
- If alternative field signal is strong, compare fields directly.
- For open questions, demand concrete examples from real behavior.
- Never repeat prior wording or identical intent.
- Keep prompt concise and user-friendly.`
      }
    ],
    fallback,
    userGroqApiKey
  );

  const cleanedOptions =
    generated.type === 'mcq'
      ? (generated.options ?? []).slice(0, 4).map((option, index) => ({
          id: option.id?.trim() || `o${index + 1}`,
          label: option.label?.trim() || `Option ${index + 1}`
        }))
      : undefined;

  const hasValidMcqOptions = generated.type !== 'mcq' || (cleanedOptions && cleanedOptions.length === 4);
  const typeMatchesStrategy = generated.type === strategy.requiredType;
  if (!hasValidMcqOptions || !typeMatchesStrategy) {
    return fallback;
  }

  const candidate: AdaptiveQuestion = {
    id: generated.id?.trim() || `q-${createId()}`,
    type: generated.type === 'mcq' ? 'mcq' : 'open',
    prompt: generated.prompt?.trim() || fallback.prompt,
    whyAsking: generated.whyAsking?.trim() || fallback.whyAsking,
    options: cleanedOptions
  };

  if (isDuplicatePrompt(candidate.prompt, input.history)) {
    return {
      ...fallback,
      id: `q-${createId()}`,
      prompt: `${fallback.prompt} Use a fresh example from your recent work.`
    };
  }

  return candidate;
}

async function buildRoadmap(
  input: AdaptiveInterviewRequest,
  analysis: AdaptiveAnalysis,
  recommendations: CareerRecommendation[],
  userGroqApiKey?: string
): Promise<AdaptiveRoadmap> {
  const topRole = recommendations[0]?.role ?? analysis.primaryField;
  const fallback: AdaptiveRoadmap = {
    immediate: recommendations[0]?.firstSprint ?? [
      `Do one mini project that simulates real work in ${topRole}.`,
      'Collect objective feedback from one mentor or professional.',
      'Track energy level and learning speed after each session.'
    ],
    month1: [
      `Build fundamentals for ${topRole} with daily deliberate practice.`,
      'Create one portfolio artifact showing measurable output.',
      'Refine communication of your value proposition.'
    ],
    month2to3: [
      'Complete two real-world projects with clear outcomes.',
      'Prepare targeted interview stories from those projects.',
      'Apply to roles or internships aligned with top recommendations.'
    ],
    portfolioProjects: [
      'Project 1: role-specific practical build',
      'Project 2: collaboration-oriented execution case study',
      'Project 3: measurable impact experiment'
    ]
  };

  return generateStructuredJson<AdaptiveRoadmap>(
    [
      {
        role: 'system',
        content:
          'You are a career roadmap planner. Return strict JSON with practical, time-bounded actions.'
      },
      {
        role: 'user',
        content: `Create a role-improvement roadmap JSON with keys:
immediate (string[] 3-5 items for next 14 days),
month1 (string[] 3-5 items),
month2to3 (string[] 3-5 items),
portfolioProjects (string[] 3-5 items).

User aspiration: ${input.dreamRole}
Inferred primary field: ${analysis.primaryField}
Alternative fields: ${analysis.alternativeFields.join(', ')}
Evidence: ${analysis.evidence.join(' | ')}
Top recommendations: ${JSON.stringify(recommendations.slice(0, 3))}

Rules:
- Keep steps execution-focused and realistic for students/new graduates.
- Include one networking and one portfolio step in each phase where possible.
- Avoid vague motivational advice.`
      }
    ],
    fallback,
    userGroqApiKey
  ).then((roadmap) => ({
    immediate: (roadmap.immediate ?? fallback.immediate).slice(0, 5),
    month1: (roadmap.month1 ?? fallback.month1).slice(0, 5),
    month2to3: (roadmap.month2to3 ?? fallback.month2to3).slice(0, 5),
    portfolioProjects: (roadmap.portfolioProjects ?? fallback.portfolioProjects).slice(0, 5)
  }));
}

async function buildCounselorSummary(
  analysis: AdaptiveAnalysis,
  recommendations: CareerRecommendation[],
  turns: number,
  userGroqApiKey?: string
) {
  const fallback = `After ${turns} adaptive questions, strongest near-term fit appears to be ${recommendations[0]?.role ?? analysis.primaryField}.`;

  try {
    const text = await generateText([
      {
        role: 'system',
        content:
          'You are a practical career counselor. Write a concise summary in under 95 words.'
      },
      {
        role: 'user',
        content: `Write a concise counselor verdict using this data:
analysis=${JSON.stringify(analysis)}
top_recommendations=${JSON.stringify(recommendations.slice(0, 3))}`
      }
    ], userGroqApiKey);
    return text.trim() || fallback;
  } catch {
    return fallback;
  }
}

function shouldStopInterview(turns: number, analysis: AdaptiveAnalysis) {
  if (turns >= MAX_INTERVIEW_TURNS) {
    return true;
  }

  if (turns < 4) {
    return false;
  }

  const unresolvedContradiction = analysis.contradictionStrength >= 35 && turns < 10;
  if (unresolvedContradiction) {
    return false;
  }

  if (analysis.confidence >= 85 && analysis.scoreGap >= 10 && analysis.missingChecks.length <= 1) {
    return true;
  }

  if (
    turns >= 6 &&
    analysis.confidence >= 78 &&
    analysis.scoreGap >= 8 &&
    analysis.openAnswerCount >= 2 &&
    analysis.missingChecks.length <= 2
  ) {
    return true;
  }

  if (turns >= 10 && analysis.confidence >= 72 && analysis.scoreGap >= 6) {
    return true;
  }

  if (turns >= 14 && analysis.confidence >= 68) {
    return true;
  }

  return false;
}

async function buildFinalReport(input: AdaptiveInterviewRequest, analysis: AdaptiveAnalysis, userGroqApiKey?: string): Promise<AdaptiveFinalReport> {
  const resumeEvidence = runResumeEvidenceAgent(input.resumeText);
  const { recommendations } = runCareerMatchAgent(
    analysis.traitVector,
    resumeEvidence.evidenceVector,
    resumeEvidence.extractedSkills,
    input.dreamRole
  );
  const roadmap = await buildRoadmap(input, analysis, recommendations, userGroqApiKey);
  const counselorSummary = await buildCounselorSummary(analysis, recommendations, input.history.length, userGroqApiKey);

  return {
    headline:
      input.dreamRole.trim() &&
      analysis.primaryField.toLowerCase() !== input.dreamRole.trim().toLowerCase() &&
      analysis.contradictionStrength >= 35
        ? `Conclusion: ${analysis.primaryField} appears stronger than "${input.dreamRole}" right now.`
        : `Conclusion: ${analysis.primaryField} is currently the strongest fit direction.`,
    confidence: analysis.confidence,
    inferredPrimaryField: analysis.primaryField,
    alternativeFields: analysis.alternativeFields,
    evidence: analysis.evidence,
    contradictions: analysis.contradictions,
    counselorSummary,
    recommendations,
    roadmap
  };
}

export async function runAdaptiveInterviewStep(input: AdaptiveInterviewRequest, userGroqApiKey?: string): Promise<AdaptiveInterviewResponse> {
  const turns = input.history.length;
  const analysis = await inferAdaptiveAnalysis(input, userGroqApiKey);
  const stop = shouldStopInterview(turns, analysis);

  if (stop) {
    const finalReport = await buildFinalReport(input, analysis, userGroqApiKey);
    return {
      done: true,
      turns,
      maxTurns: MAX_INTERVIEW_TURNS,
      confidence: analysis.confidence,
      interviewerThought: analysis.interviewerThought,
      finalReport
    };
  }

  const nextQuestion = await generateNextQuestion(input, analysis, userGroqApiKey);
  return {
    done: false,
    turns,
    maxTurns: MAX_INTERVIEW_TURNS,
    confidence: analysis.confidence,
    interviewerThought: analysis.interviewerThought,
    nextQuestion
  };
}
