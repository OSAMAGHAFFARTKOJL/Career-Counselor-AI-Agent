import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';

export const metadata: Metadata = {
  title: 'Career Counselor Multi-Agent Studio',
  description: 'MCQ-driven AI career counseling with interview, evidence, challenge, and recommendation agents.',
  metadataBase: new URL('http://localhost:3000')
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <SiteHeader />
          {children}
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
