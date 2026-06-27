import Link from 'next/link';
import { BrainCircuit, LogIn, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/auth/logout-button';
import { getCurrentUser } from '@/lib/auth';

export async function SiteHeader() {
  const { user } = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BrainCircuit className="h-5 w-5" />
          </span>
          <span>CareerMind AI</span>
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <LogoutButton />
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login?next=%2F%23studio">
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">
                  <Sparkles className="h-4 w-4" />
                  Get Started
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
