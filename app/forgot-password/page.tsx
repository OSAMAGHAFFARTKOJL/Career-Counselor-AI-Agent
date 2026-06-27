import Link from 'next/link';
import { AuthCard } from '@/components/auth/auth-card';

export default function ForgotPasswordPage() {
  return <AuthCard mode="forgot" title="Forgot password" description="We will email a secure reset link." footer={<Link href="/login" className="text-primary underline-offset-4 hover:underline">Back to login</Link>} />;
}