import { AuthForm } from '@/components/auth/auth-form';
import { RedirectIfAuthenticated } from '@/components/auth/redirect-if-authenticated';

export default function SignupPage() {
  return (
    <RedirectIfAuthenticated>
      <AuthForm mode="signup" />
    </RedirectIfAuthenticated>
  );
}
