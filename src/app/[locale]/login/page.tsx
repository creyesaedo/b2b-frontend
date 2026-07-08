import { AuthForm } from '@/components/auth/auth-form';
import { RedirectIfAuthenticated } from '@/components/auth/redirect-if-authenticated';

export default function LoginPage() {
  return (
    <RedirectIfAuthenticated>
      <AuthForm mode="login" />
    </RedirectIfAuthenticated>
  );
}
