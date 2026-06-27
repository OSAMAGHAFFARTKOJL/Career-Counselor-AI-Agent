import { NextRequest } from 'next/server';
import { validateDreamCareer } from '@/lib/agents/dream-validator';
import { discoverPersonality } from '@/lib/agents/psychologist';
import { recommendCareer } from '@/lib/agents/career';
import { generateRoadmap } from '@/lib/agents/roadmap';
import { simulateCareerDay } from '@/lib/agents/simulation';
import { generateReport } from '@/lib/agents/report';
import { requireUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    await requireUser();
    const { messages = [], userGroqApiKey } = await request.json();
    const lastMessage = messages[messages.length - 1]?.content ?? '';
    const intent = detectIntent(lastMessage);

    let content = '';
    if (intent === 'validate') {
      content = await validateDreamCareer(lastMessage, userGroqApiKey);
    } else if (intent === 'roadmap') {
      const roadmap = await generateRoadmap(lastMessage, userGroqApiKey);
      content = JSON.stringify(roadmap, null, 2);
    } else if (intent === 'simulate') {
      content = await simulateCareerDay(lastMessage, userGroqApiKey);
    } else if (intent === 'report') {
      const report = await generateReport(lastMessage, userGroqApiKey);
      content = JSON.stringify(report, null, 2);
    } else if (intent === 'career') {
      const careers = await recommendCareer(lastMessage, userGroqApiKey);
      content = JSON.stringify(careers, null, 2);
    } else {
      const interview = await discoverPersonality(lastMessage, userGroqApiKey);
      content = JSON.stringify(interview, null, 2);
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const chunks = content.match(/.{1,28}/g) ?? [content];
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return new Response('Unauthorized', { status: 401 });
    }
    if (error instanceof Error && error.message === 'BOTH_API_KEYS_UNAVAILABLE') {
      return new Response('BOTH_API_KEYS_UNAVAILABLE', { status: 400 });
    }
    throw error;
  }
}

function detectIntent(text: string) {
  const normalized = text.toLowerCase();
  if (normalized.includes('roadmap') || normalized.includes('plan')) return 'roadmap';
  if (normalized.includes('day in the life') || normalized.includes('simulate')) return 'simulate';
  if (normalized.includes('report')) return 'report';
  if (normalized.includes('career') || normalized.includes('recommend')) return 'career';
  if (normalized.includes('dream') || normalized.includes('challenge')) return 'validate';
  return 'interview';
}
