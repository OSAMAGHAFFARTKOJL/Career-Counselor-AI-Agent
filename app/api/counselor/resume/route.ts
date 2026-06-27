import { NextRequest } from 'next/server';
import { extractResumeText } from '@/lib/resume/extract-text';
import { requireUser } from '@/lib/auth';

export const runtime = 'nodejs';

function normalizeResumeText(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

export async function POST(request: NextRequest) {
  try {
    await requireUser();
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return Response.json({ error: 'Resume file is required.' }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const isTxt = file.type === 'text/plain' || fileName.endsWith('.txt');
    const isPdf = file.type === 'application/pdf' || fileName.endsWith('.pdf');
    const isDocx =
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx');

    if (!isTxt && !isPdf && !isDocx) {
      return Response.json({ error: 'Unsupported file type. Upload PDF, DOCX, or TXT.' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const extractedText = isTxt
      ? Buffer.from(buffer).toString('utf-8')
      : await extractResumeText(file, buffer);

    const normalized = normalizeResumeText(extractedText);
    if (!normalized) {
      return Response.json({ error: 'No readable text found in this file.' }, { status: 400 });
    }

    return Response.json({
      text: normalized.slice(0, 30000),
      preview: normalized.slice(0, 800),
      totalCharacters: normalized.length
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    return Response.json({ error: message }, { status: 500 });
  }
}
