"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

export function AuthCard({ mode, title, description, footer }: { mode: AuthMode; title: string; description: string; footer: React.ReactNode }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const nextPath = new URLSearchParams(window.location.search).get('next');
    const redirectPath = nextPath?.startsWith('/') ? nextPath : '/#studio';

    if (mode === 'forgot') {
      const result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      setLoading(false);
      if (result.error) {
        toast.error(result.error.message);
        return;
      }
      toast.success('Password reset email sent.');
      return;
    }

    if (mode === 'reset') {
      if (password !== confirmPassword) {
        setLoading(false);
        toast.error('Passwords do not match.');
        return;
      }
      const result = await supabase.auth.updateUser({ password });
      setLoading(false);
      if (result.error) {
        toast.error(result.error.message);
        return;
      }
      toast.success('Password updated successfully.');
      router.push('/login');
      return;
    }

    const result =
      mode === 'signup'
        ? await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/auth/callback` } })
        : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (result.error) {
      toast.error(result.error.message);
      return;
    }

    if (mode === 'signup' && !result.data.session) {
      toast.success('Check your email to verify your account.');
      return;
    }

    toast.success(mode === 'signup' ? 'Account created successfully.' : 'Signed in successfully.');
    router.push(redirectPath as Parameters<typeof router.push>[0]);
    router.refresh();
  }

  return (
    <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-grid px-4 py-10">
      <Card className="w-full max-w-md border-border/60 bg-card/95 shadow-glow">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === 'signup' ? <Input placeholder="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} /> : null}
            {mode !== 'reset' ? <Input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} /> : null}
            {mode !== 'forgot' ? <Input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} /> : null}
            {mode === 'reset' ? <Input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /> : null}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : mode === 'reset' ? 'Update password' : 'Login'}</Button>
          </form>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">{footer}</div>
        </CardContent>
      </Card>
    </main>
  );
}
