import { NextRequest } from 'next/server';
import { generateReport } from '@/lib/agents/report';
import { requireUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    await requireUser();
    const body = await request.json();
    const report = await generateReport(JSON.stringify(body), body.userGroqApiKey);
    return Response.json({ report });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'BOTH_API_KEYS_UNAVAILABLE') {
      return Response.json({ error: 'BOTH_API_KEYS_UNAVAILABLE' }, { status: 400 });
    }
    throw error;
  }
}
