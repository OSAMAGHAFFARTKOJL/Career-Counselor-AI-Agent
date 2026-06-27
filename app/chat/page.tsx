import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ChatClient } from '@/components/chat/chat-client';

export default async function ChatPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect('/login');
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();

  return <ChatClient userName={profile?.full_name ?? data.user.email ?? 'Student'} />;
}