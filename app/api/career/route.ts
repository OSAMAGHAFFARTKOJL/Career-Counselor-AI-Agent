import { NextRequest } from 'next/server';
import { recommendCareer } from '@/lib/agents/career';
import { calculateSkillGap } from '@/lib/agents/skill-gap';
import { requireUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    await requireUser();
    const body = await request.json();
    const careers = await recommendCareer(JSON.stringify(body), body.userGroqApiKey);
    const selectedCareerSkills = body.selectedCareerSkills ?? [];
    const skillGap = await calculateSkillGap(body.currentSkills ?? [], selectedCareerSkills);
    return Response.json({ careers, skillGap });
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
