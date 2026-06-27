'use client';

import { useEffect, useMemo, useState } from 'react';
import { useUserGroqKey } from '@/contexts/user-groq-key-context';
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  FileUp,
  Loader2,
  Radar,
  RefreshCw,
  Sparkles,
  Target
} from 'lucide-react';
import { MAX_INTERVIEW_TURNS } from '@/lib/counselor/constants';
import type { CareerRecommendation } from '@/lib/counselor/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type InterviewQuestion = {
  id: string;
  type: 'mcq' | 'open';
  prompt: string;
  whyAsking: string;
  options?: Array<{ id: string; label: string }>;
};

type InterviewTurn = {
  questionId: string;
  question: string;
  type: 'mcq' | 'open';
  whyAsking: string;
  options?: Array<{ id: string; label: string }>;
  answer: string;
  selectedOptionId?: string;
};

type FinalRoadmap = {
  immediate: string[];
  month1: string[];
  month2to3: string[];
  portfolioProjects: string[];
};

type FinalReport = {
  headline: string;
  confidence: number;
  inferredPrimaryField: string;
  alternativeFields: string[];
  evidence: string[];
  contradictions: string[];
  counselorSummary: string;
  recommendations: CareerRecommendation[];
  roadmap: FinalRoadmap;
};

type AdaptiveResponse = {
  done: boolean;
  turns: number;
  maxTurns: number;
  confidence: number;
  interviewerThought: string;
  nextQuestion?: InterviewQuestion;
  finalReport?: FinalReport;
  error?: string;
};

type Stage = 'onboarding' | 'interview' | 'report';

function safePercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function CounselorStudio() {
  const { apiKey, setIsModalOpen } = useUserGroqKey();
  const [stage, setStage] = useState<Stage>('onboarding');
  const [dreamRole, setDreamRole] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [resumeUploadError, setResumeUploadError] = useState<string | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);

  const [history, setHistory] = useState<InterviewTurn[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [openAnswer, setOpenAnswer] = useState('');

  const [confidence, setConfidence] = useState(0);
  const [interviewerThought, setInterviewerThought] = useState('Ready to evaluate your fit.');
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<(() => Promise<void>) | null>(null);

  const transcriptPreview = useMemo(() => history.slice(-3), [history]);
  const progress = safePercent((history.length / MAX_INTERVIEW_TURNS) * 100);

  async function parseResumeFile(file: File) {
    setResumeUploadError(null);
    setIsParsingResume(true);
    setResumeFileName(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/counselor/resume', { method: 'POST', body: formData });
      const payload = (await response.json()) as { text?: string; error?: string };
      if (!response.ok || !payload.text) {
        throw new Error(payload.error ?? 'Resume parsing failed.');
      }

      setResumeText(payload.text);
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Resume parsing failed.';
      setResumeUploadError(message);
      setResumeText('');
      setResumeFileName('');
    } finally {
      setIsParsingResume(false);
    }
  }

  async function askAdaptiveEngine(nextHistory: InterviewTurn[]) {
    const response = await fetch('/api/counselor/adaptive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dreamRole,
        resumeText,
        history: nextHistory,
        userGroqApiKey: apiKey
      })
    });

    const payload = (await response.json()) as AdaptiveResponse;
    if (!response.ok) {
      throw new Error(payload.error ?? 'Adaptive engine failed.');
    }

    setConfidence(payload.confidence);
    setInterviewerThought(payload.interviewerThought);

    if (payload.done) {
      if (!payload.finalReport) {
        throw new Error('Final report was not returned.');
      }
      setFinalReport(payload.finalReport);
      setCurrentQuestion(null);
      setStage('report');
      return;
    }

    if (!payload.nextQuestion) {
      throw new Error('Next question was not returned.');
    }

    setCurrentQuestion(payload.nextQuestion);
    setSelectedOptionId('');
    setOpenAnswer('');
    setStage('interview');
  }

  async function startInterview() {
    setError(null);
    if (!dreamRole.trim()) {
      setError('Please tell us what role you think you can become.');
      return;
    }

    setIsThinking(true);
    try {
      await askAdaptiveEngine([]);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Could not start adaptive interview.';
      setError(message);
      setPendingRequest(() => () => askAdaptiveEngine([]));
      setIsModalOpen(true);
    } finally {
      setIsThinking(false);
    }
  }

  async function submitCurrentAnswer() {
    if (!currentQuestion) {
      return;
    }

    let answerText = '';
    let selectedId: string | undefined;

    if (currentQuestion.type === 'mcq') {
      if (!selectedOptionId) {
        return;
      }
      const selected = currentQuestion.options?.find((option) => option.id === selectedOptionId);
      answerText = selected?.label ?? '';
      selectedId = selectedOptionId;
    } else {
      answerText = openAnswer.trim();
      if (!answerText) {
        return;
      }
    }

    const turn: InterviewTurn = {
      questionId: currentQuestion.id,
      question: currentQuestion.prompt,
      type: currentQuestion.type,
      whyAsking: currentQuestion.whyAsking,
      options: currentQuestion.options,
      answer: answerText,
      selectedOptionId: selectedId
    };

    const updatedHistory = [...history, turn];
    setHistory(updatedHistory);
    setIsThinking(true);
    setError(null);

    try {
      await askAdaptiveEngine(updatedHistory);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Could not continue adaptive interview.';
      setError(message);
      setPendingRequest(() => () => askAdaptiveEngine(updatedHistory));
      setIsModalOpen(true);
    } finally {
      setIsThinking(false);
    }
  }

  useEffect(() => {
    if (apiKey && pendingRequest) {
      setPendingRequest(null);
      pendingRequest();
    }
  }, [apiKey, pendingRequest]);

  function restartSession() {
    setStage('onboarding');
    setDreamRole('');
    setResumeText('');
    setResumeFileName('');
    setResumeUploadError(null);
    setHistory([]);
    setCurrentQuestion(null);
    setSelectedOptionId('');
    setOpenAnswer('');
    setConfidence(0);
    setInterviewerThought('Ready to evaluate your fit.');
    setFinalReport(null);
    setError(null);
    setIsThinking(false);
  }

  if (stage === 'report' && finalReport) {
    return (
      <div className="space-y-8">
        <Card className="border-border/70 bg-card/85 shadow-glow">
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge variant="secondary" className="w-fit text-xs uppercase tracking-[0.2em]">
                Adaptive Final Verdict
              </Badge>
              <Button variant="outline" size="sm" onClick={restartSession}>
                <RefreshCw className="h-4 w-4" />
                New Session
              </Button>
            </div>
            <CardTitle className="text-2xl sm:text-3xl">{finalReport.headline}</CardTitle>
            <CardDescription className="text-base leading-7">{finalReport.counselorSummary}</CardDescription>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-border/60 bg-card px-3 py-1">Confidence: {finalReport.confidence}%</span>
              <span className="rounded-full border border-border/60 bg-card px-3 py-1">Primary field: {finalReport.inferredPrimaryField}</span>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/70 bg-card/85">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radar className="h-5 w-5 text-primary" />
                Evidence and Contradictions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="mb-2 font-medium">Strong signals</p>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  {finalReport.evidence.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              {finalReport.contradictions.length > 0 && (
                <div>
                  <p className="mb-2 font-medium">Counter-signals</p>
                  <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                    {finalReport.contradictions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {finalReport.alternativeFields.length > 0 && (
                <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
                  <p className="font-medium">Alternative fields to validate</p>
                  <p className="mt-1 text-muted-foreground">{finalReport.alternativeFields.join(', ')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/85">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-accent" />
                Improvement Roadmap
              </CardTitle>
              <CardDescription>Concrete actions to improve fit and readiness.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <RoadmapBlock title="Next 14 Days" items={finalReport.roadmap.immediate} />
              <RoadmapBlock title="Month 1" items={finalReport.roadmap.month1} />
              <RoadmapBlock title="Month 2-3" items={finalReport.roadmap.month2to3} />
              <RoadmapBlock title="Portfolio Projects" items={finalReport.roadmap.portfolioProjects} />
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/70 bg-card/85">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Recommended Roles (Business Value Included)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            {finalReport.recommendations.map((recommendation) => (
              <div key={recommendation.role} className="rounded-3xl border border-border/60 bg-background/70 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold">{recommendation.role}</h3>
                  <Badge>{recommendation.fitScore}% fit</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-border/60 bg-card px-3 py-1">Demand: {recommendation.marketDemand}</span>
                  <span className="rounded-full border border-border/60 bg-card px-3 py-1">Salary: {recommendation.salaryRange}</span>
                  <span className="rounded-full border border-border/60 bg-card px-3 py-1">{recommendation.growthOutlook}</span>
                </div>
                <div className="mt-4 space-y-2">
                  {recommendation.whyFits.map((line) => (
                    <p key={line} className="text-sm leading-6 text-muted-foreground">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/85 shadow-glow">
        <CardHeader>
          <Badge variant="secondary" className="w-fit text-xs uppercase tracking-[0.2em]">
            Model-Driven Adaptive Interview
          </Badge>
          <CardTitle className="text-2xl sm:text-3xl">
            Start with aspiration, then let the system intelligently adapt.
          </CardTitle>
          <CardDescription className="text-base">
            The next question is generated from your latest answer, dream role, and resume evidence. No fixed script.
          </CardDescription>
        </CardHeader>
      </Card>

      {stage === 'onboarding' && (
        <Card className="border-border/70 bg-card/85">
          <CardHeader>
            <CardTitle>Onboarding: Dream Role + Resume Evidence</CardTitle>
            <CardDescription>Tell us your target role and optionally upload resume PDF/DOCX/TXT.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">What do you think you can become?</label>
              <Input
                value={dreamRole}
                onChange={(event) => setDreamRole(event.target.value)}
                placeholder="Example: Product Manager, AI Engineer, Data Analyst"
              />
            </div>

            <div className="space-y-3 rounded-2xl border border-border/60 bg-background/70 p-4">
              <p className="text-sm font-medium">Optional resume upload</p>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border/70 bg-card px-4 py-2 text-sm">
                {isParsingResume ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                {isParsingResume ? 'Extracting...' : 'Upload PDF / DOCX / TXT'}
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void parseResumeFile(file);
                    }
                  }}
                />
              </label>
              {resumeFileName && !resumeUploadError && (
                <p className="text-xs text-muted-foreground">Parsed file: {resumeFileName}</p>
              )}
              {resumeUploadError && <p className="text-xs text-destructive">{resumeUploadError}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Or paste highlights</label>
              <Textarea
                value={resumeText}
                onChange={(event) => setResumeText(event.target.value)}
                placeholder="Paste projects, internships, achievements, and tools."
                className="min-h-[140px]"
              />
            </div>

            <Button onClick={startInterview} disabled={isThinking || isParsingResume}>
              {isThinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Start Intelligent Interview
            </Button>
          </CardContent>
        </Card>
      )}

      {stage === 'interview' && currentQuestion && (
        <Card className="border-border/70 bg-card/85">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>{currentQuestion.prompt}</CardTitle>
              <Badge variant="outline">{history.length + 1}/{MAX_INTERVIEW_TURNS}</Badge>
            </div>
            <CardDescription>{currentQuestion.whyAsking}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentQuestion.type === 'mcq' ? (
              <div className="grid gap-3">
                {currentQuestion.options?.map((option) => {
                  const active = selectedOptionId === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        active
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border/60 bg-background/70 hover:border-primary/60 hover:bg-primary/5'
                      }`}
                      onClick={() => setSelectedOptionId(option.id)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <Textarea
                value={openAnswer}
                onChange={(event) => setOpenAnswer(event.target.value)}
                placeholder="Write your answer clearly with a real example."
                className="min-h-[120px]"
              />
            )}

            <Button
              onClick={submitCurrentAnswer}
              disabled={
                isThinking ||
                (currentQuestion.type === 'mcq' ? !selectedOptionId : !openAnswer.trim())
              }
            >
              {isThinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isThinking ? 'Generating next adaptive question...' : 'Submit and Continue'}
            </Button>
          </CardContent>
        </Card>
      )}

      {stage === 'interview' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border/70 bg-card/85">
            <CardHeader>
              <CardTitle className="text-base">Interviewer Intelligence State</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="h-2 rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-muted-foreground">Confidence: {confidence}%</p>
              <p>{interviewerThought}</p>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/85">
            <CardHeader>
              <CardTitle className="text-base">Recent Answers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {transcriptPreview.length === 0 ? (
                <p>No answers yet.</p>
              ) : (
                transcriptPreview.map((turn, index) => (
                  <div key={`${turn.questionId}-${index}`} className="rounded-xl border border-border/60 bg-background/70 p-3">
                    <p className="font-medium text-foreground">{turn.question}</p>
                    <p className="mt-1">{turn.answer}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {stage !== 'report' && (
        <p className="text-xs text-muted-foreground">
          Interview adapts to your answers and stops automatically once confidence is sufficient, with a hard cap of {MAX_INTERVIEW_TURNS} questions.
        </p>
      )}
    </div>
  );
}

function RoadmapBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 font-medium">{title}</p>
      <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
