"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useUserGroqKey } from '@/contexts/user-groq-key-context';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
};

const starterPrompts = [
  'I want to become an AI engineer.',
  'I do not know what career suits me.',
  'Challenge my dream career honestly.',
  'What should I do if I like research and leadership?'
];

export function ChatClient({ userName }: { userName: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'assistant', content: `Welcome ${userName}. I will understand your background first, then challenge your assumptions, then recommend careers with reasoning.` }
  ]);
  const [draft, setDraft] = useState('');
  const [isPending, startTransition] = useTransition();
  const [pendingUserMessage, setPendingUserMessage] = useState<Message | null>(null);
  const [pendingAssistantId, setPendingAssistantId] = useState<string | null>(null);
  const scrollAnchor = useRef<HTMLDivElement | null>(null);
  const { apiKey, setIsModalOpen } = useUserGroqKey();
  const canSend = draft.trim().length > 0 && !isPending;

  useEffect(() => {
    scrollAnchor.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const suggestedReplies = useMemo(() => starterPrompts, []);

  async function submitMessage(text: string) {
    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: text };
    const assistantId = crypto.randomUUID();
    setPendingUserMessage(userMessage);
    setPendingAssistantId(assistantId);
    setMessages((current) => [...current, userMessage, { id: assistantId, role: 'assistant', content: '', streaming: true }]);
    setDraft('');

    try {
      await sendRequest(userMessage, assistantId, apiKey);
    } catch (error) {
      // Show popup for ANY error!
      setIsModalOpen(true);
    }
  }

  async function sendRequest(userMessage: Message, assistantId: string, userGroqApiKey: string | null) {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [...messages, userMessage], userGroqApiKey })
    });

    if (!response.ok) {
      // Always throw for non-ok responses!
      const errorText = await response.text();
      throw new Error(errorText || 'API request failed');
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      setMessages((current) => current.map((message) => (message.id === assistantId ? { ...message, content: buffer, streaming: true } : message)));
    }

    setMessages((current) => current.map((message) => (message.id === assistantId ? { ...message, content: buffer, streaming: false } : message)));
  }

  // If API key was just saved, retry the last request!
  useEffect(() => {
    if (apiKey && pendingUserMessage && pendingAssistantId) {
      sendRequest(pendingUserMessage, pendingAssistantId, apiKey);
      setPendingUserMessage(null);
      setPendingAssistantId(null);
    }
  }, [apiKey]);

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">Career chat</p>
          <h1 className="mt-2 text-3xl font-semibold">Your AI Career Psychologist</h1>
          <p className="mt-2 text-sm text-muted-foreground">Adaptive interview, resume reasoning, career validation, and roadmap generation in one premium interface.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">Streaming</Badge>
          <Badge variant="secondary">Markdown</Badge>
          <Badge variant="secondary">Multi-agent</Badge>
        </div>
      </header>

      <section className="grid min-h-[72vh] gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="flex min-h-[72vh] flex-col border-border/60 bg-card/80">
          <CardHeader className="border-b border-border/60">
            <CardTitle>Conversation</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <div className="flex h-full flex-col gap-4 overflow-y-auto px-5 py-6">
              {messages.map((message) => (
                <div key={message.id} className={cn('max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm', message.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted text-foreground')}>
                  {message.streaming ? <TypingDots /> : null}
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                    code({ className, children }) {
                      return <code className={cn('rounded-lg bg-background px-1.5 py-0.5 text-[0.85em]', className)}>{children}</code>;
                    }
                  }}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              ))}
              <div ref={scrollAnchor} />
            </div>
          </CardContent>
          <div className="border-t border-border/60 p-4">
            <div className="space-y-3">
              <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Describe your dream career, your background, or ask the AI to challenge your assumptions..." className="min-h-28" />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {suggestedReplies.map((reply) => (
                    <button key={reply} type="button" onClick={() => setDraft(reply)} className="rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary hover:text-foreground">
                      {reply}
                    </button>
                  ))}
                </div>
                <Button disabled={!canSend} onClick={() => startTransition(() => submitMessage(draft))}>
                  <Send className="h-4 w-4" />
                  {isPending ? 'Analyzing' : 'Send'}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle>Suggested next steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• Ask the psychologist agent to start a guided interview.</p>
              <p>• Upload a resume in the dashboard for structured extraction.</p>
              <p>• Challenge the dream career before you commit to it.</p>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle>Response format</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>All AI output includes reasoning, recommended careers, skill gaps, and roadmap content when relevant.</p>
              <div className="rounded-3xl border border-border/60 bg-background p-4">
                <p className="mb-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">Example output</p>
                <p className="text-sm leading-6">Top career: Product Manager. Confidence: 91%. Why: systems thinking, communication, and leadership signals.</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wand2 className="h-4 w-4" /> Mode</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Adaptive, challenging, and explainable. Not a generic chatbot.
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

function TypingDots() {
  return <span className="mb-2 inline-flex gap-1"><span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" /><span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.1s]" /><span className="h-2 w-2 animate-bounce rounded-full bg-current" /></span>;
}
