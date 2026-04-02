import { Suspense } from 'react';
import { BasicProfileForm } from '@/components/basic-profile-form';

export default function BasicOnboardingPage() {
  return (
    <div className="site-shell narrow-shell page-section page-stack">
      <Suspense fallback={null}>
        <BasicProfileForm />
      </Suspense>
    </div>
  );
}
