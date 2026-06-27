import Link from 'next/link';
import { AuthCard } from '@/components/auth/auth-card';

export default function ResetPasswordPage() {
  return <AuthCard mode="reset" title="Reset password" description="Set a new password for your account." footer={<Link href="/login" className="text-primary underline-offset-4 hover:underline">Back to login</Link>} />;
}