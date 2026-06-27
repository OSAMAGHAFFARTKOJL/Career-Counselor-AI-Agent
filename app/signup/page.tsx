import Link from 'next/link';
import { AuthCard } from '@/components/auth/auth-card';

export default function SignupPage() {
  return <AuthCard mode="signup" title="Create your account" description="Start your career analysis in minutes." footer={<Link href="/login" className="text-primary underline-offset-4 hover:underline">Already have an account?</Link>} />;
}