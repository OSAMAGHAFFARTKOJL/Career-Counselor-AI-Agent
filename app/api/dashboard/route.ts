import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const [profile, resumes, analyses] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle(),
    supabase.from('resumes').select('*').eq('user_id', data.user.id).order('created_at', { ascending: false }),
    supabase.from('analyses').select('*').eq('user_id', data.user.id).order('created_at', { ascending: false })
  ]);

  return Response.json({
    profile: profile.data,
    resumes: resumes.data ?? [],
    analyses: analyses.data ?? []
  });
}