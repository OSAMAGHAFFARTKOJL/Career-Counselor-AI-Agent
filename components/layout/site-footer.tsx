import { BrainCircuit } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-card/70">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BrainCircuit className="h-5 w-5" />
            </span>
            CareerMind AI
          </div>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            A session-based AI career counselor built around the official studio flow.
          </p>
        </div>
      </div>
    </footer>
  );
}
