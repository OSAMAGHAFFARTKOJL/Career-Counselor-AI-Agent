"use client";

import { Toaster } from 'sonner';
import { UserGroqKeyProvider } from '@/contexts/user-groq-key-context';
import { ApiKeyModal } from '@/components/api-key-modal';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserGroqKeyProvider>
      {children}
      <ApiKeyModal />
      <Toaster richColors position="top-right" />
    </UserGroqKeyProvider>
  );
}
