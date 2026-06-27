import { NextRequest } from 'next/server';
import { MIN_ADAPTIVE_QUESTIONS } from '@/lib/counselor/adaptive-interview';
import { counselorQuestions } from '@/lib/counselor/question-bank';
import { runCounselorSession } from '@/lib/counselor/engine';
import type { CounselorSessionInput } from '@/lib/counselor/types';
import { requireUser } from '@/lib/auth';

export const runtime = 'nodejs';

function validatePayload(body: CounselorSessionInput) {
  if (!body || typeof body !== 'object' || !body.answers || typeof body.answers !== 'object') {
    return 'Invalid payload. Expected an answers object.';
  }

  const totalAnswered = counselorQuestions.filter((question) => Boolean(body.answers[question.id])).length;
  if (totalAnswered < MIN_ADAPTIVE_QUESTIONS) {
    return `Please answer at least ${MIN_ADAPTIVE_QUESTIONS} adaptive questions before analyzing.`;
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    await requireUser();
    const body = (await request.json()) as CounselorSessionInput & { userGroqApiKey?: string };
    const validationError = validatePayload(body);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const result = await runCounselorSession({
      answers: body.answers,
      dreamRole: body.dreamRole?.trim(),
      resumeText: body.resumeText?.trim()
    }, body.userGroqApiKey);

    return Response.json({ result });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'BOTH_API_KEYS_UNAVAILABLE') {
      return Response.json({ error: 'BOTH_API_KEYS_UNAVAILABLE' }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    return Response.json({ error: message }, { status: 500 });
  }
}
