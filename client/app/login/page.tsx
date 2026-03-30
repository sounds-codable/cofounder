import { Suspense } from 'react';
import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  return (
    <div className="site-shell narrow-shell page-section page-stack">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
