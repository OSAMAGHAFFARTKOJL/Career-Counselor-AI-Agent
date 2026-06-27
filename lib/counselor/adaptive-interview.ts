import { careerTracks } from '@/lib/counselor/career-tracks';
import { runCareerMatchAgent, runIntakeAgent, runResumeEvidenceAgent } from '@/lib/counselor/agents';
import { counselorQuestions } from '@/lib/counselor/question-bank';
import type { McqQuestion, TraitKey } from '@/lib/counselor/types';
import { traitKeys } from '@/lib/counselor/types';

export const MIN_ADAPTIVE_QUESTIONS = 8;
export const MAX_ADAPTIVE_QUESTIONS = 11;

const foundationQuestionIds = ['q1', 'q2', 'q3', 'q4'];
const dreamFocusedQuestionIds = ['q9', 'q10', 'q11'];
const skillFocusedQuestionIds = ['q6', 'q8', 'q12'];

function findQuestionById(questionId: string) {
  return counselorQuestions.find((question) => question.id === questionId);
}

function getQuestionDisagreementWeights(answers: Record<string, string>, dreamRole?: string, resumeText?: string) {
  const intake = runIntakeAgent(answers);
  const resume = runResumeEvidenceAgent(resumeText);
  const { recommendations } = runCareerMatchAgent(
    intake.traitVector,
    resume.evidenceVector,
    resume.extractedSkills,
    dreamRole
  );

  const firstTrack = careerTracks.find((track) => track.role === recommendations[0]?.role);
  const secondTrack = careerTracks.find((track) => track.role === recommendations[1]?.role);

  const disagreement: Record<TraitKey, number> = {
    analytical: 0.2,
    creative: 0.2,
    social: 0.2,
    leadership: 0.2,
    structured: 0.2,
    riskTaking: 0.2,
    handsOn: 0.2,
    digital: 0.2,
    research: 0.2,
    business: 0.2
  };

  if (!firstTrack) {
    return disagreement;
  }

  for (const trait of traitKeys) {
    const firstWeight = firstTrack.weights[trait] ?? 0;
    const secondWeight = secondTrack?.weights[trait] ?? 0;
    disagreement[trait] = Math.abs(firstWeight - secondWeight) + 0.2;
  }

  return disagreement;
}

function questionCoverageByTrait(question: McqQuestion, trait: TraitKey) {
  const values = question.options.map((option) => option.weights[trait] ?? 0);
  const max = Math.max(...values);
  const min = Math.min(...values);
  return max - min;
}

function scoreQuestion(
  question: McqQuestion,
  disagreement: Record<TraitKey, number>,
  hasDreamRole: boolean,
  hasResumeText: boolean
) {
  const base = traitKeys.reduce((sum, trait) => {
    return sum + questionCoverageByTrait(question, trait) * disagreement[trait];
  }, 0);

  const dreamBonus = hasDreamRole && dreamFocusedQuestionIds.includes(question.id) ? 1.8 : 0;
  const skillBonus = hasResumeText && skillFocusedQuestionIds.includes(question.id) ? 1.2 : 0;
  return base + dreamBonus + skillBonus;
}

export function shouldStopAdaptiveInterview(args: {
  answers: Record<string, string>;
  dreamRole?: string;
  resumeText?: string;
}) {
  const answeredCount = Object.keys(args.answers).length;
  if (answeredCount < MIN_ADAPTIVE_QUESTIONS) {
    return false;
  }

  if (answeredCount >= MAX_ADAPTIVE_QUESTIONS) {
    return true;
  }

  const intake = runIntakeAgent(args.answers);
  const resume = runResumeEvidenceAgent(args.resumeText);
  const { recommendations } = runCareerMatchAgent(
    intake.traitVector,
    resume.evidenceVector,
    resume.extractedSkills,
    args.dreamRole
  );

  const topScore = recommendations[0]?.fitScore ?? 0;
  const secondScore = recommendations[1]?.fitScore ?? 0;
  const margin = topScore - secondScore;
  const confidence = intake.confidence;

  return margin >= 10 && confidence >= 70;
}

export function getNextAdaptiveQuestion(args: {
  answers: Record<string, string>;
  dreamRole?: string;
  resumeText?: string;
}): McqQuestion | null {
  const answeredIds = new Set(Object.keys(args.answers));

  for (const questionId of foundationQuestionIds) {
    if (!answeredIds.has(questionId)) {
      return findQuestionById(questionId) ?? null;
    }
  }

  if (shouldStopAdaptiveInterview(args)) {
    return null;
  }

  const unansweredQuestions = counselorQuestions.filter((question) => !answeredIds.has(question.id));
  if (unansweredQuestions.length === 0) {
    return null;
  }

  const disagreement = getQuestionDisagreementWeights(args.answers, args.dreamRole, args.resumeText);
  const hasDreamRole = Boolean(args.dreamRole?.trim());
  const hasResumeText = Boolean(args.resumeText?.trim());

  const nextQuestion = unansweredQuestions
    .map((question) => ({
      question,
      score: scoreQuestion(question, disagreement, hasDreamRole, hasResumeText)
    }))
    .sort((a, b) => b.score - a.score)[0];

  return nextQuestion?.question ?? null;
}
