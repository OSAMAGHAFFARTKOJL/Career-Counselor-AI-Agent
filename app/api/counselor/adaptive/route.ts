import { NextRequest } from 'next/server';
import { runAdaptiveInterviewStep, type AdaptiveInterviewRequest } from '@/lib/counselor/adaptive-engine';
import { MAX_INTERVIEW_TURNS } from '@/lib/counselor/constants';
import { requireUser } from '@/lib/auth';

export const runtime = 'nodejs';

function sanitizeRequest(body: AdaptiveInterviewRequest): AdaptiveInterviewRequest {
  return {
    dreamRole: body.dreamRole?.trim() ?? '',
    resumeText: body.resumeText?.trim() ?? '',
    history: Array.isArray(body.history) ? body.history.slice(0, MAX_INTERVIEW_TURNS) : []
  };
}

export async function POST(request: NextRequest) {
  try {
    await requireUser();
    const rawBody = (await request.json()) as AdaptiveInterviewRequest & { userGroqApiKey?: string };
    const body = sanitizeRequest(rawBody);

    if (!body.dreamRole) {
      return Response.json(
        { error: 'Please provide the role the user thinks they can become.' },
        { status: 400 }
      );
    }

    const result = await runAdaptiveInterviewStep(body, rawBody.userGroqApiKey);
    return Response.json(result);
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
