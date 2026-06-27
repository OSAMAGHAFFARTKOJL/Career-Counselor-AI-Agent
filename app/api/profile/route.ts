import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
  return Response.json({ profile });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const admin = createSupabaseAdminClient() as any;
  const { error } = await admin.from('profiles').upsert({
    id: data.user.id,
    email: data.user.email,
    full_name: body.fullName ?? null,
    avatar_url: body.avatarUrl ?? null,
    onboarding_completed: Boolean(body.onboardingCompleted)
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}