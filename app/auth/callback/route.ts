import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensureProfile } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const redirectTo = new URL('/#studio', request.url);

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
    const { data } = await supabase.auth.getUser();

    if (data.user) {
      await ensureProfile(supabase, data.user);
    }
  }

  return Response.redirect(redirectTo, 302);
}
