import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getCurrentUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();

    return { supabase, user: data.user ?? null };
  } catch {
    return { supabase: null, user: null };
  }
}

export async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error('Unauthorized');
  }

  return { supabase, user: data.user };
}

export async function ensureProfile(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }
) {
  const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
  if (existingProfile) {
    return { error: null };
  }

  const fullName = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null;

  return supabase.from('profiles').insert({
    id: user.id,
    email: user.email ?? null,
    full_name: fullName
  });
}
