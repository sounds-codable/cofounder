import { Suspense } from 'react';
import { BasicProfileForm } from '@/components/basic-profile-form';

export default function BasicOnboardingPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 md:py-8">
      <Suspense fallback={null}>
        <BasicProfileForm />
      </Suspense>
    </div>
  );
}
