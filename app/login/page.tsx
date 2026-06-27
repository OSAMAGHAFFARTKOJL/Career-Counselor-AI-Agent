import Link from 'next/link';
import { AuthCard } from '@/components/auth/auth-card';

export default function LoginPage() {
  return (
    <AuthCard
      mode="login"
      title="Welcome back"
      description="Continue your career analysis."
      footer={
        <>
          <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
            Create a new account
          </Link>
          <Link href="/forgot-password" className="text-primary underline-offset-4 hover:underline">
            Forgot password?
          </Link>
        </>
      }
    />
  );
}
