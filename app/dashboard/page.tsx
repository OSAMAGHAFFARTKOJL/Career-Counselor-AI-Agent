import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensureProfile } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, Brain, FileText, Radar, Sparkles } from 'lucide-react';
import { ProgressChart } from '@/components/dashboard/progress-chart';
import { CareerDNAChips } from '@/components/dashboard/career-dna-chips';
import { RecentAnalysisCard } from '@/components/dashboard/recent-analysis-card';
import { LogoutButton } from '@/components/auth/logout-button';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect('/login');
  }

  await ensureProfile(supabase, data.user);

  const [{ data: profile }, { data: resumes }, { data: analyses }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle(),
    supabase.from('resumes').select('*').eq('user_id', data.user.id).order('created_at', { ascending: false }).limit(1),
    supabase.from('analyses').select('*').eq('user_id', data.user.id).order('created_at', { ascending: false }).limit(5)
  ]);

  const completion = profile?.onboarding_completed ? 92 : 63;
  const hasResume = Boolean(resumes?.length);
  const recentAnalysis = analyses?.[0];

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 sm:px-8 lg:px-12">
        <header className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">Dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold">Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Your career profile is shaping up. Continue the conversation, review your report, or upload a better resume.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">Profile completion {completion}%</Badge>
            <LogoutButton />
            <Button asChild>
              <Link href="/chat">Continue analysis <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Sparkles} label="Career DNA" value="Builder / Strategist" subtext="Two dominant traits" />
            <StatCard icon={FileText} label="Resume status" value={hasResume ? 'Analyzed' : 'Awaiting upload'} subtext={hasResume ? 'Structured text saved' : 'Upload PDF or DOCX'} />
            <StatCard icon={Radar} label="Recent confidence" value="91%" subtext="Top career match" />
            <StatCard icon={BriefcaseBusiness} label="Recommended careers" value="5" subtext="Ready to explore" />
          </div>
          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle>Career progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressChart progress={completion} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle>Career DNA</CardTitle>
            </CardHeader>
            <CardContent>
              <CareerDNAChips />
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle>Recent analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentAnalysisCard analysis={recentAnalysis} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-border/60 bg-card/80 lg:col-span-2">
            <CardHeader>
              <CardTitle>Recommended careers</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {['Product Manager', 'AI Engineer', 'UX Researcher', 'Data Analyst', 'Strategy Consultant'].map((career) => (
                <div key={career} className="rounded-3xl border border-border/60 bg-background p-4">
                  <p className="font-semibold">{career}</p>
                  <p className="mt-2 text-sm text-muted-foreground">High confidence match with a structured reasoning trail.</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle>Resume upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Upload a PDF or DOCX resume to trigger extraction, structured analysis, and persistent storage.</p>
              <Button className="mt-4 w-full" asChild>
                <Link href="/resume">Upload resume</Link>
              </Button>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/roadmap">Open roadmap</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle>Daily tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• Review interview answers</p>
              <p>• Upload a fresher resume version</p>
              <p>• Compare top two career paths</p>
              <p>• Start week one of the roadmap</p>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle>Recent conversations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• “Why do you want to be an AI Engineer?”</p>
              <p>• “Do you want depth, breadth, or ownership?”</p>
              <p>• “What work leaves you energized, not just impressed?”</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle>Learning roadmap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Daily: interview a user story, ship one skill practice item.</p>
            <p>Weekly: build a project artifact and review a career path.</p>
            <p>Monthly: publish a portfolio piece and simulate interviews.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function StatCard({ icon: Icon, label, value, subtext }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; subtext: string }) {
  return (
    <Card className="border-border/60 bg-card/80">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>
          <Icon className="h-10 w-10 rounded-2xl bg-primary/10 p-2.5 text-primary" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{subtext}</p>
      </CardContent>
    </Card>
  );
}
