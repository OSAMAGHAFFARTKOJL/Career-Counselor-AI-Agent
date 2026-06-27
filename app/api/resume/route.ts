import { NextRequest } from 'next/server';
import { extractResumeText } from '@/lib/resume/extract-text';
import { analyzeResume } from '@/lib/agents/resume';
import { requireUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    await requireUser();
    const formData = await request.formData();
    const file = formData.get('file');
    const userGroqApiKey = formData.get('userGroqApiKey') as string | undefined;

    if (!(file instanceof File)) {
      return Response.json({ error: 'Resume file is required.' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const extractedText = await extractResumeText(file, buffer);
    const analysis = await analyzeResume(extractedText, userGroqApiKey);

    return Response.json({
      extractedText,
      analysis
    });
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
