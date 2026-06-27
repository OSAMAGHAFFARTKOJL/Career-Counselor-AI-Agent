"use client";

import { useState } from 'react';
import { Upload, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useUserGroqKey } from '@/contexts/user-groq-key-context';

export function ResumeUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ extractedText?: string; analysis?: unknown } | null>(null);
  const { apiKey, setIsModalOpen } = useUserGroqKey();

  async function handleUpload() {
    if (!file) {
      toast.error('Choose a PDF or DOCX resume first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    if (apiKey) {
      formData.append('userGroqApiKey', apiKey);
    }

    setLoading(true);
    const response = await fetch('/api/resume', { method: 'POST', body: formData });
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setIsModalOpen(true);
      return;
    }

    setResult(payload);
    toast.success('Resume uploaded and analyzed.');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle>Resume intelligence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border/60 bg-background px-6 py-12 text-center transition hover:border-primary">
            <Upload className="h-10 w-10 text-primary" />
            <div>
              <p className="font-semibold">Drop a PDF or DOCX resume here</p>
              <p className="mt-2 text-sm text-muted-foreground">The file will be parsed instantly and analyzed for career signals.</p>
            </div>
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>

          {file ? (
            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm">
              <FileText className="h-4 w-4 text-primary" />
              <span>{file.name}</span>
            </div>
          ) : null}

          <Button onClick={handleUpload} disabled={loading}>
            <CheckCircle2 className="h-4 w-4" />
            {loading ? 'Analyzing...' : 'Upload and analyze'}
          </Button>

          {result?.extractedText ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold">Extracted text preview</p>
              <pre className="max-h-72 overflow-auto rounded-3xl bg-muted p-4 text-xs leading-6">{result.extractedText}</pre>
            </div>
          ) : null}

          {result?.analysis ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold">Structured analysis</p>
              <pre className="max-h-96 overflow-auto rounded-3xl bg-muted p-4 text-xs leading-6">{JSON.stringify(result.analysis, null, 2)}</pre>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
