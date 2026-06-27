import Link from 'next/link';
import { ArrowRight, BrainCircuit, ClipboardList, ShieldCheck, Target } from 'lucide-react';
import { CounselorStudio } from '@/components/counselor/counselor-studio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth';

const pillars = [
  {
    title: 'Interview Agent',
    description: 'Asks structured MCQ questions to uncover motivation, temperament, and work-style signals.',
    icon: ClipboardList
  },
  {
    title: 'Evidence Agent',
    description: 'Uses resume or project text inside the same studio flow.',
    icon: BrainCircuit
  },
  {
    title: 'Reality Check Agent',
    description: 'Challenges assumptions and highlights hidden risks before career decisions.',
    icon: ShieldCheck
  },
  {
    title: 'Career Match Agent',
    description: 'Ranks role-fit and gives a short validation sprint.',
    icon: Target
  }
];

export default async function HomePage() {
  const { user } = await getCurrentUser();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_35%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.16),transparent_35%),hsl(var(--background))]">
      <section className="border-b border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 sm:px-8 lg:px-12">
          <Badge className="w-fit">AI Career Counselor</Badge>
          <div className="max-w-4xl space-y-6">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              The counselor-style career studio for confused or first-time job seekers.
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              Login with Supabase, then start the official studio flow: dream role, optional resume evidence, adaptive questions, and a final career plan.
            </p>
            {!user && (
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/login?next=%2F%23studio">
                    Login to Start
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/signup">Create Account</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-12">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pillars.map((pillar) => (
            <Card key={pillar.title} className="border-border/70 bg-card/85">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <pillar.icon className="h-4 w-4 text-primary" />
                  {pillar.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">{pillar.description}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="studio" className="mx-auto max-w-5xl px-6 pb-16 sm:px-8 lg:px-12">
        <div className="mb-6 flex items-center gap-2 text-sm font-medium text-primary">
          <ArrowRight className="h-4 w-4" />
          Start your counseling session
        </div>
        {user ? (
          <CounselorStudio />
        ) : (
          <Card className="border-border/70 bg-card/90 shadow-glow">
            <CardHeader>
              <CardTitle>Login required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Please login first. After login, this same section will show the full counselor studio.</p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/login?next=%2F%23studio">Login</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/signup">Create Account</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}
